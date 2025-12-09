/**
 * Fetch census feature data for given coordinates from any ArcGIS service
 * @param {number[]} latLon - Array of [latitude, longitude]
 * @param {string} serviceUrl - ArcGIS service URL for the census data
 * @returns {Promise<Object|null>} Census feature data, or null if no feature found
 * @throws {Error} For network errors or malformed responses
 */
export const fetchFeatureByLatLon = async (latLon, serviceUrl) => {
  const lat = latLon[0];
  const lon = latLon[1];
  const queryUrl = `${serviceUrl}/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;
  const response = await fetch(queryUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  // return either the first matching feature or null (no feature found)
  return data.features && data.features.length > 0 ? data.features[0] : null;
};