import './style.css'
import { parseLatLonFromURL, getLatLonByGeoLocation } from './coordinates.js'
import { fetchFeatureByLatLon } from './censusApi.js'
import { createZipCard, createNoDataMessageCard, displayErrorMessage, showTemporaryMessage } from './ui.js'
import { showAddressModal } from './addressModal.js'
import { CENSUS_CONFIG } from './config.js'
import { redirectToLatLon } from './utils.js'
import { initializeMap } from './map.js'

const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
const DEBUG_MESSAGE_DURATION = 3000;
const debugMessage = DEBUG_MODE ? showTemporaryMessage : () => {};

// Debug: Check if API key is loaded
console.log('API Key loaded:', import.meta.env.VITE_ARCGIS_API_KEY ? 'Yes' : 'No');

// Handle Find Location button click - show address modal
const handleFindLocation = () => {
  // Get API key from environment variable (Vite prefix: VITE_)
  const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
  
  if (!apiKey) {
    console.warn('No ArcGIS API key found. Set VITE_ARCGIS_API_KEY environment variable.');
    alert('Geocoding requires an ArcGIS API key. Please configure VITE_ARCGIS_API_KEY environment variable.');
    return;
  }
  
  showAddressModal(
    (coordinates) => {
      // coordinates is [lat, lon] array
      const [lat, lon] = coordinates;
      
      // Update the URL and reload data for the new location
      const newUrl = `${window.location.pathname}?lat=${lat}&lon=${lon}`;
      window.history.pushState({}, '', newUrl);
      
      // Reload the page with new coordinates
      window.location.reload();
    },
    () => {
      console.log('Address search cancelled');
    },
    apiKey // Pass the API key to the modal
  );
};

async function main() {

  const STORY_ID = '4961e406d6364e198c71cdf3de491285';
  let latLon = parseLatLonFromURL(); 

  if (!latLon) {

    debugMessage(`⚠️ No lat/lon params provided.`);
    debugMessage(`Attempting geolocation...`);

    latLon = await getLatLonByGeoLocation();

    if (latLon) {
        debugMessage(`Location found: ${latLon}`);
        debugMessage("Redirecting...");
    } else {
        latLon = [43.6767, -70.3477]; // Lamb Street, Portland, ME
        debugMessage(`⚠️ No location found.`);
        debugMessage(`Defaulting to Lamb Street, Portland, ME, ${latLon}...`);
        debugMessage("Redirecting...");
    }

    redirectToLatLon(latLon, DEBUG_MODE && DEBUG_MESSAGE_DURATION);

    return;

  }

  // Show loading spinner for data query
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <div class="spinner-text">Loading data...</div>
  `;
  document.body.appendChild(loadingDiv);

  try {

    const zipFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].zip.url);
    const stateFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].state.url);
    const nationFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].nation.url);

    // Remove loading spinner
    document.body.removeChild(loadingDiv);

    let card;
    if (zipFeature && stateFeature && nationFeature) {
      
      // Create field mappings object
      const fieldMappings = {
        zip: CENSUS_CONFIG["Housing Affordability Index 2025"].zip.fields,
        state: CENSUS_CONFIG["Housing Affordability Index 2025"].state.fields,
        nation: CENSUS_CONFIG["Housing Affordability Index 2025"].nation.fields
      };
      
      card = createZipCard(
        latLon, 
        zipFeature.attributes,
        stateFeature.attributes,
        nationFeature.attributes,
        fieldMappings,
        handleFindLocation
      );
      console.log("Created zip info card");
    } else {
      console.log("No zip data found for coordinates:", latLon);
      card = createNoDataMessageCard(latLon);
      console.log("Created no data message card");
    }

    const divContentContainer = document.createElement('div');
    divContentContainer.className = 'content-container';

    const divInfoPanel = document.createElement('div');
    divInfoPanel.className = 'info-panel';
    divInfoPanel.appendChild(card);

    const divMap = document.createElement('div');
    divMap.className = 'map';

    const divMapPanel = document.createElement('div');
    divMapPanel.className = 'map-panel';
    divMapPanel.appendChild(divMap);

    divContentContainer.appendChild(divInfoPanel);
    divContentContainer.appendChild(divMapPanel);

    document.body.insertBefore(divContentContainer, document.body.firstChild);

    await initializeMap(divMap, latLon, zipFeature, CENSUS_CONFIG["Housing Affordability Index 2025"].zip.url);
      
  } catch (error) {
    // Remove loading spinner on error
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
    console.error("Error fetching data:", error);
    displayErrorMessage(latLon[0], latLon[1], error);
  }

  /*
  // Create and insert the embed script manually
  const s = document.createElement('script');
  s.src = "https://storymaps.arcgis.com/embed/view";
  s.setAttribute("data-story-id", STORY_ID);
  s.setAttribute("data-root-node", ".storymaps-root");
  document.body.appendChild(s);
  */

}

main();
