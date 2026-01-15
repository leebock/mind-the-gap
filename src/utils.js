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
