/*

Copyright 2026 Esri

Licensed under the Apache License Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 

*/

import './style.css'
import { fetchFeatureByID, fetchFeatureByLatLon } from './arcgisRestApi.js'
import { showZipModal } from './zipModal.js'
import { redirectToZip, waitForElement, getLatLonByGeoLocation, displayErrorMessage, showTemporaryMessage, createBufferedExtent } from './utils.js'
import { createStoryProxy } from './storyProxy.js'

/****  config constants ****/

const STORY_ID = '4961e406d6364e198c71cdf3de491285';

const SERVICE_URL_ZIP = 'https://services8.arcgis.com/peDZJliSvYims39Q/ArcGIS/rest/services/USA_Latest_Esri_Demographics/FeatureServer/1';
const SERVICE_URL_STATE = 'https://services8.arcgis.com/peDZJliSvYims39Q/ArcGIS/rest/services/USA_Latest_Esri_Demographics/FeatureServer/2';
const SERVICE_URL_NATION = 'https://services8.arcgis.com/peDZJliSvYims39Q/ArcGIS/rest/services/USA_Latest_Esri_Demographics/FeatureServer/0';

const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
const DEBUG_MESSAGE_DURATION = 3000;

const RANDOM_ZIPS = [
  '33109', '94027', '90210', '11962', '31561', '98039', '96754', '99501', '20817',
  '30327', '97034', '75205', '81435', '78704', '55406', '68104', '58201', '71048'
];

const currencyFormat = {
  style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
};

/****  end config constants ****/

const debugMessage = DEBUG_MODE ? showTemporaryMessage : () => {};
const debugLog = DEBUG_MODE ? console.log : () => {};
const getRandomZip = () => RANDOM_ZIPS[Math.floor(Math.random() * RANDOM_ZIPS.length)];

/************************************************************/
/****************** begin main driver ***********************/
/************************************************************/
          
(async () => { // (using async IIFE syntax)

  /**********************************************/
  // 1) ensure that we have a zip to work with...
  /**********************************************/

  // Parse the ZIP code from the query string

  const zipParam = new URLSearchParams(window.location.search).get("zip");
  
  if (!zipParam) {

    // if zipParam doesn't exist; redirect page to a fallback zip, using the 
    // following logic:
    // a. Attempt geolocation to get lat/lon and fetch ZIP
    // b. If geolocation fails, use a random ZIP from the list

    debugMessage(`⚠️ No ZIP param provided.`);
    debugMessage(`Attempting geolocation...`);

    const latLon = await getLatLonByGeoLocation();
    let zipToUse = getRandomZip();
    
    if (latLon) {
        debugMessage(`Geolocated user at: ${latLon.latitude}, ${latLon.longitude}`);
        debugMessage(`Fetching ZIP code for location...`);
        const zipPreview = await fetchFeatureByLatLon(latLon, SERVICE_URL_ZIP);
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

  /**************************************************************************/
  // 2) if we made it to here without a redirect, then we have a zipParam to use!
  // time to go to work...
  /**************************************************************************/

  // Show loading spinner for data query
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <div class="spinner-custom"></div>
    <div class="spinner-text">Updating maps to reflect your selected location...</div>
  `;
  document.body.appendChild(loadingDiv);

  let zipFeature, stateFeature, nationFeature;

  // query for all the necessary features

  try {
    zipFeature = await fetchFeatureByID(SERVICE_URL_ZIP, "ID", zipParam, true);
    if (!zipFeature) {
      throw new Error(`No data found for ZIP code: ${zipParam}`);
    }
    stateFeature = await fetchFeatureByID(SERVICE_URL_STATE, "ST_ABBREV", zipFeature.attributes.ST_ABBREV);
    nationFeature = await fetchFeatureByID(SERVICE_URL_NATION, "ST_ABBREV", "US");

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

  /**************************************************************/
  // 3) Okay, this is the crux of the whole operation:
  //
  // The createStoryProxy function intercepts StoryMaps fetch requests 
  // before they're processed by the presentation engine. This creates 
  // an opportunity to perform substitutions on the json data based on 
  // the information from the above queries.
  //
  // In the code below, 
  // - the url parameter -- actually just a partial text
  //   match -- identifies which json files to modify 
  //   (there are several).
  // - the substitutionFn then performs the actual modifications.
  /**************************************************************/

  window.fetch = createStoryProxy(
    [
      {
        /* content web map substitutions */
        url: `0bd47aab81d448a88d0b706c261b3931/data`,
        substitutionFn: (json) => {
          debugLog("Modifying web map JSON:", json);
          json.operationalLayers[5].layerDefinition.definitionExpression = `ID = '${zipFeature.attributes.ID}'`;
        }
      },
      {
        /* locator web map substitutions */
        url: `a522e87aaa1747b0af699d3b9fe7b21c/data`,
        substitutionFn: (json) => {
          debugLog("Modifying web map JSON:", json);
          json.operationalLayers[2].customParameters.where = `ZIP_STRING='${zipFeature.attributes.ID}'`;
        }
      },
      {
        /* chart data substitutions */
        url: `chart_details`,
        substitutionFn: (json) => {
          const chartTitle = json.chartConfig?.title?.content?.text?.toLowerCase();
          debugLog("Modifying chart data JSON:", json.chartConfig?.title?.content?.text);

          const fieldName = chartTitle?.includes('income') ? 'MEDHINC_CY' :
                            chartTitle?.includes('value') ? 'MEDVAL_CY' :
                            chartTitle?.includes('affordability') ? 'HAI_CY' :
                            null;

          if (!fieldName) {
            debugLog("Unknown chart type:", json.chartConfig.title.content.text);            
            return;
          };

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
        substitutionFn:     
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
              webmapResource.data.extent = createBufferedExtent(zipFeature.envelope, 0.05);
            }
          );
        
          for (const nodeId in json.publishedData.nodes) {
            const node = json.publishedData.nodes[nodeId];
            debugLog(node.type, nodeId, node);
            switch(nodeId) {
              case 'n-93Bl6H': // median household income infographic
                node.data.title = zipFeature.attributes.MEDHINC_CY.toLocaleString('en-US', currencyFormat);
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-qeiFVu': // median home value infographic
                node.data.title = zipFeature.attributes.MEDVAL_CY >= 2000000 ? `≥ $2 million`
                  : zipFeature.attributes.MEDVAL_CY >= 1000000 ? `$${(zipFeature.attributes.MEDVAL_CY / 1000000).toFixed(2)} million`
                  : zipFeature.attributes.MEDVAL_CY.toLocaleString('en-US', currencyFormat);
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-INkYub': // housing affordability index infographic
                node.data.title = zipFeature.attributes.HAI_CY.toFixed(0);
                node.data.description = node.data.description.replace("[ZIP code]", zipFeature.attributes.ID);
                break;
              case 'n-vhFhqc': // 'Change zip code button' - modify href to # to make the link easily findable
                node?.data && (node.data.link = '#');
                break;
              case 'n-uUsrRp': // 'Surprise me button' - modify href to # to make the link easily findable
                node?.data && (node.data.link = '#');
                break;
              default:
                break;
            }          
          }
        }  
      }
    ]
  );

  /*******************************************************/
  // 4) The rest of the code is about embedding the story
  // and wiring up a few UI elements once the DOM is ready 
  /*******************************************************/

  window.storyMapsEmbedConfig = {
    topOffset: '4.4rem'
  };

  // Create and insert the embed script manually
  const s = document.createElement('script');
  s.src = "https://storymaps.arcgis.com/embed/view";
  s.setAttribute("data-story-id", STORY_ID);
  s.setAttribute("data-root-node", ".storymaps-root");
  document.body.appendChild(s);


  // Remove loading spinner when story is ready
  waitForElement(
    '#n-mUAfln', // intro section
    () => {
      if (document.body.contains(loadingDiv)) {
        document.body.removeChild(loadingDiv);
      }
    }
  );

  // find the "Change ZIP code" and "Surprise me" links and attach handlers
  const handleFindZip = () => {
    showZipModal(
      async (zipCode) => {
        // Verify ZIP exists by making API call
        const zipFeature = await fetchFeatureByID(SERVICE_URL_ZIP, "ID", zipCode, false);
        return !!zipFeature;
      },
      (zipCode) => {
        // ZIP is valid, proceed with redirect
        redirectToZip(zipCode, 0, true);
      },
      () => {
        debugLog('ZIP search cancelled');
      }
    );
  };

  const handleSurpriseMe = () => {redirectToZip(getRandomZip(), 0, true);};

  waitForElement(
    '#n-2pk6Mt', // parent container of 'Change zip code' and 'Surprise me!' links
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

  // if the scroll param is present, scroll to section containing links
  waitForElement(
    '#n-fgL3qP', // parent container for h4 above links
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
    } 
  );

  // Hide the expand button for the locator map
  waitForElement('#n-ES3CjW button',(element)=>{element.style.display = 'none'})

})(); // end main driver