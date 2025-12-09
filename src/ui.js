/**
 * Display census tract information in a styled card
 * @param {Object} tractFeature - Census tract feature data
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @param {Object} fields - Object containing field mappings (name, state, county, etc.)
 */
export const createTractInfoCard = (tractFeature, lat, lon, fields) => {
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
    <p><strong>Tract:</strong> ${attrs[fields.name] || 'Unknown'}</p>
    <p><strong>State:</strong> ${attrs[fields.state] || 'Unknown'}</p>
    <p><strong>County:</strong> ${attrs[fields.county] || 'Unknown'}</p>
    <hr>
    <h3>Housing & Income Data</h3>
    <p><strong>Median Contract Rent:</strong> ${formatCurrency(attrs[fields.medianContractRent])}</p>
    <p><strong>Median Home Value:</strong> ${formatCurrency(attrs[fields.medianHomeValue])}</p>
    <p><strong>Median Household Income:</strong> ${formatCurrency(attrs[fields.medianIncome])}</p>
  `;
  
  return infoDiv;
};

/**
 * Display a friendly message when no census data is found
 * @param {number} lat - Latitude coordinate  
 * @param {number} lon - Longitude coordinate
 */
export const createNoDataMessageCard = (lat, lon) => {
  const noDataDiv = document.createElement('div');
  noDataDiv.style.cssText = `
    padding: 20px;
    margin: 20px;
    border: 1px solid #ffa726;
    border-radius: 8px;
    background-color: #fff3e0;
    color: #e65100;
    font-family: Arial, sans-serif;
    max-width: 600px;
  `;
  
  noDataDiv.innerHTML = `
    <h3>No Census Data Available</h3>
    <p>No census tract data found for coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
    <p><em>This location may be in an area not covered by the census tract boundaries, such as water bodies or remote areas.</em></p>
  `;
  
  return noDataDiv;
};

/**
 * Display an error message for failed data requests
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate  
 * @param {Error} error - Error object with message
 */
export const displayErrorMessage = (lat, lon, error) => {
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
    <h3>Error Loading Data</h3>
    <p>Failed to fetch census tract data for coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
    <p><em>${error.message}</em></p>
  `;
  document.body.insertBefore(errorDiv, document.body.firstChild);
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