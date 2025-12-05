import './style.css'
import { parseLatLonFromURL } from './coordinates.js'
import { fetchTractByLatLon } from './censusApi.js'
import { displayTractInfo, displayNoDataMessage, displayErrorMessage } from './ui.js'

const CENSUS_CONFIG = {
  "ACS Population and Housing Basics": {
    tract: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/2',
      fields: {
        name: 'NAME',
        state: 'State',
        county: 'County',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E',
        medianIncome: 'B19049_001E'
      }
    },
    state: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/0',
      fields: {
        name: 'NAME',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E',
        medianIncome: 'B19049_001E'
      }
    }
  },
  "ACS Housing Costs": {
    tract: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer/2',
      fields: {
        name: 'NAME',
        state: 'State',
        county: 'County',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E'
      }
    },
    state: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer/0',
      fields: {
        name: 'NAME',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E'
      }
    }
  }
};

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
