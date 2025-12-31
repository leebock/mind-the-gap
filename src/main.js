import './style.css'
import { fetchZipDetails, getZipByGeoLocation } from './zipService.js'
import { fetchFeatureByLatLon } from './censusApi.js'
import { displayErrorMessage, showTemporaryMessage } from './ui.js'
import { showZipModal } from './zipModal.js'
import { CENSUS_CONFIG } from './config.js'
import { redirectToZip, waitForElement } from './utils.js'
import { createStoryProxy } from './storyProxy.js'

const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
const DEBUG_MESSAGE_DURATION = 3000;
const debugMessage = DEBUG_MODE ? showTemporaryMessage : () => {};
const DEFAULT_ZIP = '92373'; // Redlands, CA

// Debug: Check if API key is loaded
//console.log('API Key loaded:', import.meta.env.VITE_ARCGIS_API_KEY ? 'Yes' : 'No');

// Handle Find ZIP button click - show ZIP modal
const handleFindZip = () => {
  showZipModal(
    (zipCode) => {
      // zipCode is a clean 5-digit string like "12345"
      const newUrl = `${window.location.pathname}?zip=${zipCode}`;
      window.history.pushState({}, '', newUrl);
      
      // Reload the page with new ZIP code
      window.location.reload();
    },
    () => {
      console.log('ZIP search cancelled');
    }
  );
};

async function main() {

  const STORY_ID = '0caacd3051ed4d788d167a67aad2816a';

  // Parse the ZIP code from the query string
  const params = new URLSearchParams(window.location.search);
  const zipParam = params.get("zip");
  if (!zipParam) {

    debugMessage(`⚠️ No ZIP param provided.`);
    debugMessage(`Attempting geolocation...`);

    const zipByGeoLocation = await getZipByGeoLocation();

    if (zipByGeoLocation) {
        debugMessage(`ZIP found: ${zipByGeoLocation}`);
        debugMessage("Redirecting...");
        redirectToZip(zipByGeoLocation, DEBUG_MODE && DEBUG_MESSAGE_DURATION);
    } else {
        debugMessage(`⚠️ No ZIP found for location.`);
        debugMessage(`Defaulting to ZIP ${DEFAULT_ZIP}...`);
        debugMessage("Redirecting...");
        redirectToZip(DEFAULT_ZIP, DEBUG_MODE && DEBUG_MESSAGE_DURATION);
    }

    return;

  }

  const zipDetails = await fetchZipDetails(zipParam);
  if (zipDetails === null) {
    showTemporaryMessage(`❌ Invalid ZIP code: ${zipParam}`);
    showTemporaryMessage(`Please try again.`);
    return;
  }

  const latLon = zipDetails?.centroid ? 
                [zipDetails.centroid.y, zipDetails.centroid.x] : 
                null;
  // validate latLon
  if (!latLon || latLon.length !== 2 || isNaN(latLon[0]) || isNaN(latLon[1])) {
    showTemporaryMessage(`❌ Invalid lat/lon for ZIP code: ${zipParam}`);
    showTemporaryMessage(`Please try again.`);
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

  let zipFeature, stateFeature, nationFeature;

  try {

    zipFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].zip.url);
    stateFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].state.url);
    nationFeature = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].nation.url);

    // Remove loading spinner
    document.body.removeChild(loadingDiv);

    if (zipFeature && stateFeature && nationFeature) {
      console.log("Data retrieval successful.");      
    } else {
      console.log("No zip data found for coordinates:", latLon);
    }
      
  } catch (error) {
    // Remove loading spinner on error
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
    console.error("Error fetching data:", error);
    displayErrorMessage(latLon[0], latLon[1], error);
  }

  // Set up fetch proxy with custom substitution logic

  const storyProxy = createStoryProxy(
    `/embed/view/${STORY_ID}/data`, 
    (json) => {

      // remove any extent data associated with webmap nodes
      Object.entries(json.publishedData.nodes)
        .filter(([_, resource]) => resource.type === "webmap")
        .forEach(([_, webmapNode]) => {
          console.log("Modifying webmap node extent:", webmapNode);
          delete webmapNode.data.extent;
          delete webmapNode.data.center;
          delete webmapNode.data.viewpoint;
          delete webmapNode.data.zoom;
        }
      );
      
      // modify the extent for each of the webmap resources
      Object.entries(json.publishedData.resources)
        .filter(([_, resource]) => resource.type === "webmap")
        .forEach(([_, webmapResource]) => {
          console.log("Modifying webmap resource extent:", webmapResource);
          console.log("Zip Feature:", zipDetails);

          const bufferedExtent = (env, buffer = 0.01) => {
            return {
              xmin: env.xmin - buffer,
              ymin: env.ymin - buffer,
              xmax: env.xmax + buffer,
              ymax: env.ymax + buffer,
              spatialReference: { wkid: 4326 }
            };
          }

          const extentWithBuffer = bufferedExtent(zipDetails.envelope, 0.02);

          webmapResource.data.viewpoint = {
            rotation: 0,
            scale: null,
            targetGeometry: {
              xmin: extentWithBuffer.xmin,
              ymin: extentWithBuffer.ymin,
              xmax: extentWithBuffer.xmax,
              ymax: extentWithBuffer.ymax,
              spatialReference: { wkid: 4326 }
            }
          };

          delete webmapResource.data.extent;

        }
      );
      
      for (const nodeId in json.publishedData.nodes) {
        const node = json.publishedData.nodes[nodeId];
        console.log(node.type, nodeId, node);
        switch(nodeId) {
          case 'n-zjAbcQ':
            node.data.text = `Housing Affordability Comparison for Zip Code ${zipFeature.attributes.ID}!`;
            break;
          case 'n-s5BlpJ':
            node.data.caption = `Zip code ${zipFeature.attributes.ID} (${zipFeature.attributes.NAME}, ${zipFeature.attributes.ST_ABBREV})`;
            break;
          case 'n-HG38Yi':
            // headers
            node.data.cells[0][1].value = zipFeature.attributes.ID;
            node.data.cells[0][2].value = stateFeature.attributes.NAME;
            // median home value
            node.data.cells[1][1].value = zipFeature.attributes.MEDVAL_CY.toLocaleString();
            node.data.cells[1][2].value = stateFeature.attributes.MEDVAL_CY.toLocaleString();
            node.data.cells[1][3].value = nationFeature.attributes.MEDVAL_CY.toLocaleString();
            // median household income
            node.data.cells[2][1].value = zipFeature.attributes.MEDHINC_CY.toLocaleString();
            node.data.cells[2][2].value = stateFeature.attributes.MEDHINC_CY.toLocaleString();
            node.data.cells[2][3].value = nationFeature.attributes.MEDHINC_CY.toLocaleString();
            // affordability index
            node.data.cells[3][1].value = zipFeature.attributes.HAI_CY.toFixed(0);
            node.data.cells[3][2].value = stateFeature.attributes.HAI_CY.toFixed(0);
            node.data.cells[3][3].value = nationFeature.attributes.HAI_CY.toFixed(0);
            break;
          default:
            break;
        }          
      }
    }  
  );

  window.fetch = storyProxy;

  // Create and insert the embed script manually
  const s = document.createElement('script');
  s.src = "https://storymaps.arcgis.com/embed/view";
  s.setAttribute("data-story-id", STORY_ID);
  s.setAttribute("data-root-node", ".storymaps-root");
  document.body.appendChild(s);

  // override the first occurence of hyperlink to run the promptZipChange function
  // on click

  waitForElement(
    '.storymaps-root a', 
    (link) => {
        link.href = "#"; // Enables keyboard focus and enter key
        link.addEventListener("click", (e) => {
          e.preventDefault();
          handleFindZip();
        });
        link.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFindZip();
          }
        });
    }
  );

}

main();
