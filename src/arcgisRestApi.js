/**
 * Fetch census feature data for given coordinates from any ArcGIS service
 * @param {number[]} latLon - Array of [latitude, longitude]
 * @param {string} serviceUrl - ArcGIS service URL for the census data
 * @param {boolean} [includeEnvelope=false] - Whether to include envelope/extent data
 * @returns {Promise<Object|null>} Census feature data, or null if no feature found
 * @throws {Error} For network errors or malformed responses
 */
export const fetchFeatureByLatLon = async (latLon, serviceUrl, includeEnvelope = false) => {
  const lat = latLon[0];
  const lon = latLon[1];
  const envelopeParams = includeEnvelope ? '&returnEnvelope=true&outSR=4326' : '';
  const queryUrl = `${serviceUrl}/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json${envelopeParams}`;
  const response = await fetch(queryUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const feature = data.features[0];
    
    // Add envelope as extent if requested and available
    if (includeEnvelope && data.features[0] && data.features[0].geometry && data.features[0].geometry.envelope) {
      feature.extent = data.features[0].geometry.envelope;
    }
    
    return feature;
  }
  
  return null;
};

/**
 * Fetch census feature data by ID from any ArcGIS service
 * @param {string} serviceUrl - ArcGIS service URL for the census data
 * @param {string} idField - Name of the ID field to query
 * @param {string} idValue - Value of the ID to search for
 * @param {boolean} [includeEnvelope=false] - Whether to include envelope/extent data
 * @returns {Promise<Object|null>} Census feature data, or null if no feature found
 * @throws {Error} For network errors or malformed responses
 */
export const fetchFeatureByID = async (serviceUrl, idField, idValue, includeEnvelope = false) => {
  const envelopeParams = includeEnvelope ? '&returnEnvelope=true&outSR=4326' : '';
  const whereClause = `${idField}='${idValue}'`;
  const queryUrl = `${serviceUrl}/query?where=${encodeURIComponent(whereClause)}&outFields=*&returnGeometry=false&f=json${envelopeParams}`;
  const response = await fetch(queryUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const feature = data.features[0];
    
    // Add envelope as extent if requested and available
    if (includeEnvelope && data.features[0] && data.features[0].geometry && data.features[0].geometry.envelope) {
      feature.extent = data.features[0].geometry.envelope;
    }
    
    return feature;
  }
  
  return null;
};