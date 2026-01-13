import './style.css'
import { fetchFeatureByID, fetchFeatureByLatLon } from './censusApi.js'
import { displayErrorMessage, showTemporaryMessage } from './ui.js'
import { showZipModal } from './zipModal.js'
import { CENSUS_CONFIG } from './config.js'
import { redirectToZip, waitForElement, getLatLonByGeoLocation } from './utils.js'
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

  const STORY_ID = '4961e406d6364e198c71cdf3de491285';

  // Parse the ZIP code from the query string
  const params = new URLSearchParams(window.location.search);
  const zipParam = params.get("zip");
  if (!zipParam) {

    debugMessage(`⚠️ No ZIP param provided.`);
    debugMessage(`Attempting geolocation...`);

    const latLon = await getLatLonByGeoLocation();
    let zipToUse = DEFAULT_ZIP;
    
    if (latLon) {
        const zipPreview = await fetchFeatureByLatLon(latLon, CENSUS_CONFIG["Housing Affordability Index 2025"].zip.url);
        if (zipPreview?.attributes?.ID) {
          zipToUse = zipPreview.attributes.ID;
          debugMessage(`ZIP found: ${zipToUse}`);
        } else {
          debugMessage(`⚠️ No ZIP found for location.`);
        }
    } else {
        debugMessage(`⚠️ Geolocation failed.`);
    }
    
    debugMessage(`Using ZIP ${zipToUse}...`);
    debugMessage("Redirecting...");
    redirectToZip(zipToUse, DEBUG_MODE && DEBUG_MESSAGE_DURATION);

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

    zipFeature = await fetchFeatureByID(CENSUS_CONFIG["Housing Affordability Index 2025"].zip.url, "ID", zipParam, true);
    if (!zipFeature) {
      throw new Error(`No data found for ZIP code: ${zipParam}`);
    }
    stateFeature = await fetchFeatureByID(CENSUS_CONFIG["Housing Affordability Index 2025"].state.url, "ST_ABBREV", zipFeature.attributes.ST_ABBREV);
    nationFeature = await fetchFeatureByID(CENSUS_CONFIG["Housing Affordability Index 2025"].nation.url, "ST_ABBREV", "US");

    if (zipFeature && stateFeature && nationFeature) {
      console.log("Data retrieval successful.");      
    } else {
      throw new Error("Failed to retrieve all necessary data features.");
    }
      
  } catch (error) {
    console.error("Error fetching data:", error);
    displayErrorMessage(error);
    return;
  } finally {
    // Remove loading spinner in all cases
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
  }

  // Set up fetch proxy with custom substitution logic

  const storyProxy = createStoryProxy(
    [
      {
        url: `a522e87aaa1747b0af699d3b9fe7b21c/data`,
        subsitutionFn: (json) => {
          console.log("Modifying web map JSON:", json);
          json.operationalLayers[2].customParameters.where = `ZIP_STRING=${zipFeature.attributes.ID}`;
        }
      },
      {
        url: `chart_details_1768335104571.json`,
        subsitutionFn: (json) => {
          console.log("Modifying chart data JSON:", json);
          json.inlineData.dataItems[0].category = zipFeature.attributes.ID;
          json.inlineData.dataItems[0].field1 = zipFeature.attributes.MEDHINC_CY;
          json.inlineData.dataItems[1].category = stateFeature.attributes.NAME;
          json.inlineData.dataItems[1].field1 = stateFeature.attributes.MEDHINC_CY;
          json.inlineData.dataItems[2].category = nationFeature.attributes.NAME;
          json.inlineData.dataItems[2].field1 = nationFeature.attributes.MEDHINC_CY;
        }
      },
      {
        url: `chart_details_1768338376638.json`,
        subsitutionFn: (json) => {
          console.log("Modifying chart data JSON:", json);
          json.inlineData.dataItems[0].category = zipFeature.attributes.ID;
          json.inlineData.dataItems[0].field1 = zipFeature.attributes.MEDVAL_CY;
          json.inlineData.dataItems[1].category = stateFeature.attributes.NAME;
          json.inlineData.dataItems[1].field1 = stateFeature.attributes.MEDVAL_CY;
          json.inlineData.dataItems[2].category = nationFeature.attributes.NAME;
          json.inlineData.dataItems[2].field1 = nationFeature.attributes.MEDVAL_CY;
        }
      },
      {
        url: `chart_details_1768335129454.json`,
        subsitutionFn: (json) => {
          console.log("Modifying chart data JSON:", json);  
          json.inlineData.dataItems[0].category = zipFeature.attributes.ID;
          json.inlineData.dataItems[0].field1 = zipFeature.attributes.HAI_CY;
          json.inlineData.dataItems[1].category = stateFeature.attributes.NAME;
          json.inlineData.dataItems[1].field1 = stateFeature.attributes.HAI_CY;
          json.inlineData.dataItems[2].category = nationFeature.attributes.NAME;
          json.inlineData.dataItems[2].field1 = nationFeature.attributes.HAI_CY;
        }
      },
      {
        /* story data substitutions */
        url: `/embed/view/${STORY_ID}/data`, 
        subsitutionFn:     
        (json) => {

          // remove any extent data associated with webmap nodes
          Object.entries(json.publishedData.nodes)
            .filter(([_, resource]) => resource.type === "webmap")
            .forEach(([_, webmapNode], index) => {
              console.log("Modifying webmap node extent:", webmapNode);
              if (index > 0) {
                delete webmapNode.data.extent;
                delete webmapNode.data.center;
                delete webmapNode.data.viewpoint;
                delete webmapNode.data.zoom;
              }
            }
          );
          
          // modify the extent for each of the webmap resources
          Object.entries(json.publishedData.resources)
            .filter(([_, resource]) => resource.type === "webmap")
            .forEach(([_, webmapResource]) => {
              console.log("Modifying webmap resource extent:", webmapResource);
              console.log("Zip Feature:", zipFeature);

              const bufferedExtent = (env, buffer = 0.01) => {
                return {
                  xmin: env.xmin - buffer,
                  ymin: env.ymin - buffer,
                  xmax: env.xmax + buffer,
                  ymax: env.ymax + buffer,
                  spatialReference: { wkid: 4326 }
                };
              }

              const extentWithBuffer = bufferedExtent(zipFeature.envelope, 0.3);
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
              case 'n-93Bl6H':
                node.data.title = zipFeature.attributes.MEDHINC_CY.toLocaleString();
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-qeiFVu':
                node.data.title = zipFeature.attributes.MEDVAL_CY.toLocaleString();
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-INkYub':
                node.data.title = zipFeature.attributes.HAI_CY.toFixed(0);
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-vhFhqc':
                console.log("Modifying ZIP change button:", node.data);
                // Change href to # to make the link easily findable
                if (node?.data) node.data.link = '#';
                break;
              case 'n-uUsrRp':
                console.log("Modifying 'Surprise me' button:", node.data);
                // Change href to # to make the link easily findable
                if (node?.data) node.data.link = '#';
                break;
              default:
                break;
            }          
          }
        }  
      }
    ]
  );

  window.fetch = storyProxy;

  // Create and insert the embed script manually
  const s = document.createElement('script');
  s.src = "https://storymaps.arcgis.com/embed/view";
  s.setAttribute("data-story-id", STORY_ID);
  s.setAttribute("data-root-node", ".storymaps-root");
  document.body.appendChild(s);

  // override the hyperlink with href="#" to open the ZIP modal

  waitForElement(
    '#n-2pk6Mt', 
    (parentDiv) => {
        console.log("Found parent div:", parentDiv);
        const links = parentDiv.querySelectorAll('a');
        if (links.length >= 1) {
          const firstLink = links[0];
          console.log("Found first link:", firstLink);
          firstLink.addEventListener("click", (e) => {
            e.preventDefault();
            handleFindZip();
          });
          firstLink.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFindZip();
            }
          });
        }
        if (links.length >= 2) {
          const secondLink = links[1];
          console.log("Found second link:", secondLink);
          secondLink.addEventListener("click", (e) => {
            e.preventDefault();
            alert("To be implemented");
          });
          secondLink.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              alert("To be implemented");
            }
          });
        }
    }
  );

}

main();
