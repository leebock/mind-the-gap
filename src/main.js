import './style.css'
import { parseLatLonFromURL } from './coordinates.js'
import { fetchTractByLatLon } from './censusApi.js'
import { displayTractInfo, displayNoDataMessage, displayErrorMessage } from './ui.js'
import { CENSUS_CONFIG } from './config.js'

async function main() {

  const STORY_ID = '4961e406d6364e198c71cdf3de491285';

  const LATLON = parseLatLonFromURL() || [43.6767, -70.3477]; // Default to Lamb Street, Portland, ME

  // Use the Population and Housing Basics tract service for now
  const currentConfig = CENSUS_CONFIG["ACS Population and Housing Basics"].tract;

  try {
    const tractFeature = await fetchTractByLatLon(LATLON[0], LATLON[1], currentConfig.url);
    
    if (tractFeature) {
      console.log("Tract Feature:", tractFeature);
      displayTractInfo(tractFeature, LATLON[0], LATLON[1], currentConfig.fields);
    } else {
      console.log("No tract data found for coordinates:", LATLON);
      displayNoDataMessage(LATLON[0], LATLON[1]);
    }
  } catch (error) {
    console.error("Error fetching tract data:", error);
    displayErrorMessage(LATLON[0], LATLON[1], error);
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
