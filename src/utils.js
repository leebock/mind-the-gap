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

/**
 * Redirect to the same page with ZIP code URL parameter
 * @param {string} zip - ZIP code to redirect to
 * @param {number} delay - Optional delay in milliseconds before redirect
 * @param {boolean} includeScroll - Optional flag to include scroll parameter
 */
export function redirectToZip(zip, delay, includeScroll) {
  const safeDelay = Number(delay) || 0;
  const base = window.location.href.split("?").shift();
  let targetUrl = `${base}?zip=${encodeURIComponent(zip)}`;
  
  if (includeScroll) {
    targetUrl += '&scroll';
  }

  if (safeDelay > 0) {
    setTimeout(() => (window.location.href = targetUrl), safeDelay);
  } else {
    window.location.href = targetUrl;
  }
}

/**
 * Waits for an element matching the selector to appear in the DOM, then executes a callback
 * @param {string} selector - CSS selector to search for
 * @param {Function} callback - Function to execute when element is found, receives the element as parameter
 */
export function waitForElement(selector, callback) {
  const interval = setInterval(
		() => {
			const element = document.querySelector(selector);
			if (element) {
				clearInterval(interval);
				callback(element);
			}
	  }, 
		100
	);
}

/**
 * Get coordinates from device geolocation
 * @returns {Promise<number[]|null>} Array of [lat, lon] if successful, null if failed
 */
export async function getLatLonByGeoLocation() {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    const { latitude, longitude } = position.coords;
    return [latitude, longitude];
  } catch (error) {
    console.warn("❌ Geolocation failed or was denied:", error);
    return null;
  }
}

/**
 * Display an error message for failed data requests
 * @param {Error} error - Error object with message
 */
export const displayErrorMessage = (error) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    padding: 20px;
    border: 1px solid #ff6b6b;
    border-radius: 8px;
    background-color: #ffe0e0;
    color: #d63031;
    font-family: Arial, sans-serif;
    max-width: 600px;
    text-align: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
  `;
  errorDiv.innerHTML = `
    <h3>Error Loading Data</h3>
    <p><em>${error.message}</em></p>
  `;
  document.body.appendChild(errorDiv);
};

/**
 * Display a temporary debug message
 * @param {string} msg - Message to display
 */
export function showTemporaryMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.padding = '0.5em';
  div.style.fontFamily = 'sans-serif';
  div.style.backgroundColor = '#ffeeba';
  div.style.border = '1px solid #f0ad4e';
  div.style.margin = '0.5em';
  document.body.appendChild(div);
}

/**
 * Create a buffered extent from an envelope
 * @param {Object} env - Envelope object with xmin, ymin, xmax, ymax properties
 * @param {number} buffer - Buffer amount to add around the extent (default 0.01)
 * @returns {Object} Buffered extent object with spatial reference
 */
export function createBufferedExtent(env, buffer = 0.01) {
  return {
    xmin: env.xmin - buffer,
    ymin: env.ymin - buffer,
    xmax: env.xmax + buffer,
    ymax: env.ymax + buffer,
    spatialReference: { wkid: 4326 }
  };
}
