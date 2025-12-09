import './style.css'
import { parseLatLonFromURL, getLatLonByGeoLocation } from './coordinates.js'
import { fetchTractByLatLon } from './censusApi.js'
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

  try {
    const tractFeature = await fetchTractByLatLon(latLon[0], latLon[1], currentConfig.url);
    
    let card;
    if (tractFeature) {
      console.log("Tract Feature:", tractFeature);
      card = createTractInfoCard(tractFeature, latLon[0], latLon[1], currentConfig.fields);
    } else {
      console.log("No tract data found for coordinates:", latLon);
      card = createNoDataMessageCard(latLon[0], latLon[1]);
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

    await initializeMap(divMap, latLon);

  } catch (error) {
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
