import './style.css'

const SERVICE_ACS_POPULATION_AND_HOUSING_BASICS_TRACT = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_10_14_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/2';
const FIELD_MEDIAN_CONTRACT_RENT = 'B25058_001E';
const FIELD_MEDIAN_HOME_VALUE = 'B25077_001E';
const FIELD_MEDIAN_HOUSEHOLD_INCOME = 'B19049_001E';
const FIELD_STATE = 'State';
const FIELD_COUNTY = 'County';
const FIELD_NAME = 'NAME';

const parseLatLonFromURL = () =>{
  const params = new URLSearchParams(window.location.search);
  const lat = params.get("lat");
  const lon = params.get("lon");
  
  if (lat && lon) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    
    // Validate coordinates
    if (!isNaN(parsedLat) && !isNaN(parsedLon) && 
        parsedLat >= -90 && parsedLat <= 90 && 
        parsedLon >= -180 && parsedLon <= 180) {
      return [parsedLat, parsedLon];
    }
  }
  
  return null; // Return null if parsing/validation fails
}

const fetchTractByLatLon = async (lat, lon) => {
  const queryUrl = `${SERVICE_ACS_POPULATION_AND_HOUSING_BASICS_TRACT}/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;
  const response = await fetch(queryUrl);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    return data.features[0]; // Return the first matching tract
  } else {
    throw new Error("No tract found for the given coordinates.");
  }
}

const displayTractInfo = (tractFeature, lat, lon) => {
  const attrs = tractFeature.attributes;
  
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `
    padding: 20px;
    margin: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    font-family: Arial, sans-serif;
    max-width: 600px;
  `;
  
  const formatCurrency = (value) => {
    if (!value || value < 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  infoDiv.innerHTML = `
    <h2>Census Tract Information</h2>
    <p><strong>Location:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
    <p><strong>Tract:</strong> ${attrs[FIELD_NAME] || 'Unknown'}</p>
    <p><strong>State:</strong> ${attrs[FIELD_STATE] || 'Unknown'}</p>
    <p><strong>County:</strong> ${attrs[FIELD_COUNTY] || 'Unknown'}</p>
    <hr>
    <h3>Housing & Income Data</h3>
    <p><strong>Median Contract Rent:</strong> ${formatCurrency(attrs[FIELD_MEDIAN_CONTRACT_RENT])}</p>
    <p><strong>Median Home Value:</strong> ${formatCurrency(attrs[FIELD_MEDIAN_HOME_VALUE])}</p>
    <p><strong>Median Household Income:</strong> ${formatCurrency(attrs[FIELD_MEDIAN_HOUSEHOLD_INCOME])}</p>
  `;
  
  document.body.insertBefore(infoDiv, document.body.firstChild);
};

async function main() {

  const STORY_ID = '4961e406d6364e198c71cdf3de491285';

  const LATLON = parseLatLonFromURL() || [43.6767, -70.3477]; // Default to Lamb Street, Portland, ME

  try {
    const tractFeature = await fetchTractByLatLon(LATLON[0], LATLON[1]);
    console.log("Tract Feature:", tractFeature);
    displayTractInfo(tractFeature, LATLON[0], LATLON[1]);
  } catch (error) {
    console.error("Error fetching tract data:", error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      padding: 20px;
      margin: 20px;
      border: 1px solid #ff6b6b;
      border-radius: 8px;
      background-color: #ffe0e0;
      color: #d63031;
      font-family: Arial, sans-serif;
      max-width: 600px;
    `;
    errorDiv.innerHTML = `
      <h3>Error Loading Tract Data</h3>
      <p>Unable to find census tract data for coordinates: ${LATLON[0].toFixed(4)}, ${LATLON[1].toFixed(4)}</p>
      <p><em>${error.message}</em></p>
    `;
    document.body.insertBefore(errorDiv, document.body.firstChild);
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
