import './style.css'
import { parseLatLonFromURL, getLatLonByGeoLocation } from './coordinates.js'
import { fetchFeatureByLatLon } from './censusApi.js'
import { createTractInfoCard, createNoDataMessageCard, displayErrorMessage, showTemporaryMessage } from './ui.js'
import { CENSUS_CONFIG } from './config.js'
import { redirectToLatLon } from './utils.js'
import { initializeMap } from './map.js'

const DEBUG_MODE = true/*new URLSearchParams(window.location.search).has("debug")*/;
const DEBUG_MESSAGE_DURATION = 3000;
const debugMessage = DEBUG_MODE ? showTemporaryMessage : () => {};

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

  // Use the Population and Housing Basics tract service for now
  const currentConfig = CENSUS_CONFIG["ACS Population and Housing Basics"].tract;

  // Show loading spinner for tract data query
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <div class="spinner-text">Loading census tract data...</div>
  `;
  document.body.appendChild(loadingDiv);

  try {

    const tractFeature = await fetchFeatureByLatLon(latLon, currentConfig.url);
    const stateFeature1 = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["ACS Population and Housing Basics"].state.url);
    const stateFeature2 = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["ACS Housing Costs"].state.url);

    console.log(stateFeature1);
    console.log(stateFeature2);

    // Remove loading spinner
    document.body.removeChild(loadingDiv);

    let card;
    if (tractFeature) {
      console.log("Tract Feature:", tractFeature);
      
      // Create field mappings object
      const fieldMappings = {
        tract: CENSUS_CONFIG["ACS Population and Housing Basics"].tract.fields,
        state1: CENSUS_CONFIG["ACS Population and Housing Basics"].state.fields,
        state2: CENSUS_CONFIG["ACS Housing Costs"].state.fields
      };
      
      card = createTractInfoCard(
        latLon, 
        tractFeature.attributes,
        stateFeature1?.attributes,
        stateFeature2?.attributes,
        fieldMappings
      );
      console.log("Created tract info card");
    } else {
      console.log("No tract data found for coordinates:", latLon);
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

    await initializeMap(divMap, latLon, tractFeature, currentConfig.url);
      
  } catch (error) {
    // Remove loading spinner on error
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
    console.error("Error fetching tract data:", error);
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
