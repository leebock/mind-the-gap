import './style.css'
import { parseLatLonFromURL } from './coordinates.js'
import { fetchTractByLatLon } from './censusApi.js'
import { displayTractInfo, displayNoDataMessage, displayErrorMessage } from './ui.js'

const SERVICE_ACS_POPULATION_AND_HOUSING_BASICS_TRACT = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/2';
const FIELD_MEDIAN_CONTRACT_RENT = 'B25058_001E';
const FIELD_MEDIAN_HOME_VALUE = 'B25077_001E';
const FIELD_MEDIAN_HOUSEHOLD_INCOME = 'B19049_001E';
const FIELD_STATE = 'State';
const FIELD_COUNTY = 'County';
const FIELD_NAME = 'NAME';

async function main() {

  const STORY_ID = '4961e406d6364e198c71cdf3de491285';

  const LATLON = parseLatLonFromURL() || [43.6767, -70.3477]; // Default to Lamb Street, Portland, ME

  try {
    const tractFeature = await fetchTractByLatLon(LATLON[0], LATLON[1], SERVICE_ACS_POPULATION_AND_HOUSING_BASICS_TRACT);
    
    if (tractFeature) {
      console.log("Tract Feature:", tractFeature);
      const fieldConstants = {
        FIELD_NAME,
        FIELD_STATE,
        FIELD_COUNTY,
        FIELD_MEDIAN_CONTRACT_RENT,
        FIELD_MEDIAN_HOME_VALUE,
        FIELD_MEDIAN_HOUSEHOLD_INCOME
      };
      displayTractInfo(tractFeature, LATLON[0], LATLON[1], fieldConstants);
    } else {
      console.log("No tract data found for coordinates:", LATLON);
      displayNoDataMessage(LATLON[0], LATLON[1]);
    }
  } catch (error) {
    console.error("Error fetching tract data:", error);
    displayErrorMessage(LATLON[0], LATLON[1], error);
  }

  /*
  SERVICE_ACS_POPULATION_AND_HOUSING_BASICS_STATE = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/0';
  SERVICE_ACS_HOUSING_COSTS_BOUNDARIES_STATE = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer/2';
  const FIELD_MEDIAN_CONTRACT_RENT_STATE = 'B25058_001E';
  const FIELD_MEDIAN_HOME_VALUE_STATE = 'B25077_001E';
  */

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
