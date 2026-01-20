import './style.css'
import { fetchFeatureByID, fetchFeatureByLatLon } from './arcgisRestApi.js'
import { displayErrorMessage, showTemporaryMessage } from './ui.js'
import { showZipModal } from './zipModal.js'
import { CENSUS_CONFIG } from './config.js'
import { redirectToZip, waitForElement, getLatLonByGeoLocation } from './utils.js'
import { createStoryProxy } from './storyProxy.js'

const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
const DEBUG_MESSAGE_DURATION = 3000;
const debugMessage = DEBUG_MODE ? showTemporaryMessage : () => {};
const debugLog = DEBUG_MODE ? console.log : () => {};
const STORY_ID = '4961e406d6364e198c71cdf3de491285';
const RANDOM_ZIPS = [
  '33109', '94027', '90210', '11962', '31561',
  '98039', '96754', '99501', '20817',
  '30327', '97034', '75205', '81435', '78704',
  '55406', '68104', '58201', '71048', '24729'
];

const getRandomZip = () => {
  const randomIndex = Math.floor(Math.random() * RANDOM_ZIPS.length);
  return RANDOM_ZIPS[randomIndex];
}

// Debug: Check if API key is loaded
//debugLog('API Key loaded:', import.meta.env.VITE_ARCGIS_API_KEY ? 'Yes' : 'No');

// Handle Find ZIP button click - show ZIP modal
const handleFindZip = () => {
  showZipModal(
    (zipCode) => {
      // zipCode is a clean 5-digit string like "12345"
      redirectToZip(zipCode, 0, true);
    },
    () => {
      debugLog('ZIP search cancelled');
    }
  );
};

// Handle Surprise Me button click - pick random ZIP and redirect
const handleSurpriseMe = () => {
  redirectToZip(getRandomZip(), 0, true);
};
          


async function main() {

  // Parse the ZIP code from the query string

  const zipParam = new URLSearchParams(window.location.search).get("zip");
  
  if (!zipParam) {

    // if zipParam doesn't exist; redirect page to a fallback zip, using the 
    // following logic:
    // 1. Attempt geolocation to get lat/lon and fetch ZIP
    // 2. If geolocation fails, use a random ZIP from the list

    debugMessage(`⚠️ No ZIP param provided.`);
    debugMessage(`Attempting geolocation...`);

    const latLon = await getLatLonByGeoLocation();
    let zipToUse = getRandomZip();
    
    if (latLon) {
        debugMessage(`Geolocated user at: ${latLon.latitude}, ${latLon.longitude}`);
        debugMessage(`Fetching ZIP code for location...`);
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

  // if we made it to here without a redirect, then we have a zipParam to use!
  // time to go to work...

  debugMessage(`✅ Using ZIP param: ${zipParam}`);

  // Show loading spinner for data query
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <div class="spinner-custom"></div>
    <div class="spinner-text">Updating maps to reflect your selected location...</div>
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
      debugLog("Data retrieval successful.");      
    } else {
      throw new Error("Failed to retrieve all necessary data features.");
    }
      
  } catch (error) {
    console.error("Error fetching data:", error);
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
    displayErrorMessage(error);
    return;
  }

  // Set up fetch proxy with custom substitution logic

  const storyProxy = createStoryProxy(
    [
      {
        /* content web map substitutions */
        url: `0bd47aab81d448a88d0b706c261b3931/data`,
        subsitutionFn: (json) => {
          debugLog("Modifying web map JSON:", json);
          json.operationalLayers[5].layerDefinition.definitionExpression = `ID = '${zipFeature.attributes.ID}'`;
        }
      },
      {
        /* locator web map substitutions */
        url: `a522e87aaa1747b0af699d3b9fe7b21c/data`,
        subsitutionFn: (json) => {
          debugLog("Modifying web map JSON:", json);
          json.operationalLayers[2].customParameters.where = `ZIP_STRING=${zipFeature.attributes.ID}`;
        }
      },
      {
        /* chart data substitutions */
        url: `chart_details`,
        subsitutionFn: (json) => {
          const chartTitle = json.chartConfig?.title?.content?.text?.toLowerCase();
          debugLog("Modifying chart data JSON:", json.chartConfig?.title?.content?.text);
          let fieldName;
          if (chartTitle?.includes('income')) {
            debugLog("Processing income chart");
            fieldName = 'MEDHINC_CY';
          } else if (chartTitle?.includes('value')) {
            debugLog("Processing value chart");
            fieldName = 'MEDVAL_CY';
          } else if (chartTitle?.includes('affordability')) {
            debugLog("Processing affordability chart");
            fieldName = 'HAI_CY';
          } else {
            debugLog("Unknown chart type:", json.chartConfig.title.content.text);            
            displayErrorMessage(`Unknown chart type: ${json.chartConfig?.title?.content?.text}`);          
          }
          json.inlineData.dataItems[0].category = zipFeature.attributes.ID;
          json.inlineData.dataItems[0].field1 = zipFeature.attributes[fieldName];
          json.inlineData.dataItems[1].category = stateFeature.attributes.NAME;
          json.inlineData.dataItems[1].field1 = stateFeature.attributes[fieldName];
          json.inlineData.dataItems[2].category = nationFeature.attributes.NAME;
          json.inlineData.dataItems[2].field1 = nationFeature.attributes[fieldName];
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
              debugLog("Modifying webmap node extent:", webmapNode);
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
              debugLog("Modifying webmap resource extent:", webmapResource);
              debugLog("Zip Feature:", zipFeature);

              const bufferedExtent = (env, buffer = 0.01) => {
                return {
                  xmin: env.xmin - buffer,
                  ymin: env.ymin - buffer,
                  xmax: env.xmax + buffer,
                  ymax: env.ymax + buffer,
                  spatialReference: { wkid: 4326 }
                };
              }

              const extentWithBuffer = bufferedExtent(zipFeature.envelope, 0.05);
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
            debugLog(node.type, nodeId, node);
            switch(nodeId) {
              case 'n-93Bl6H':
                node.data.title = zipFeature.attributes.MEDHINC_CY.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-qeiFVu':
                node.data.title = zipFeature.attributes.MEDVAL_CY.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-INkYub':
                node.data.title = zipFeature.attributes.HAI_CY.toFixed(0);
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-vhFhqc':
                debugLog("Modifying ZIP change button:", node.data);
                // Change href to # to make the link easily findable
                if (node?.data) node.data.link = '#';
                break;
              case 'n-uUsrRp':
                debugLog("Modifying 'Surprise me' button:", node.data);
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

  window.storyMapsEmbedConfig = {
    topOffset: '4.4rem'
  };

  // Create and insert the embed script manually
  const s = document.createElement('script');
  s.src = "https://storymaps.arcgis.com/embed/view";
  s.setAttribute("data-story-id", STORY_ID);
  s.setAttribute("data-root-node", ".storymaps-root");
  document.body.appendChild(s);

  // find the "Change ZIP code" and "Surprise me" links and attach handlers

  waitForElement(
    '#n-2pk6Mt', 
    (parentDiv) => {
        debugLog("Found parent div:", parentDiv);
        const links = parentDiv.querySelectorAll('a');
        if (links.length >= 1) {
          const firstLink = links[0];
          debugLog("Found first link:", firstLink);
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
          debugLog("Found second link:", secondLink);          
          secondLink.addEventListener("click", (e) => {
            e.preventDefault();
            handleSurpriseMe();
          });
          secondLink.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSurpriseMe();
            }
          });
        }
    }
  );

  waitForElement(
    '#n-fgL3qP', 
    (element) => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('scroll')) {
        debugLog('Scrolling to element:', element);
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight+10 : 90;
        const targetPosition = absoluteElementTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
      if (document.body.contains(loadingDiv)) {
        document.body.removeChild(loadingDiv);
      }
    } 
  );

}

main();