/**
 * Display census tract information in a styled card
 * @param {number[]} latLon - Array containing latitude and longitude coordinates
 * @param {Object} tractData - Census tract attributes object
 * @param {Object} stateData1 - Census state attributes from Population & Housing dataset
 * @param {Object} stateData2 - Census state attributes from Housing Costs dataset
 * @param {Object} fieldMappings - Object containing field name mappings for tract and state data
 */
export const createTractInfoCard = (latLon, tractData, stateData1, stateData2, fieldMappings) => {
  const lat = latLon[0];
  const lon = latLon[1];
  
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `
    padding: 20px;
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
  
  const formatPercent = (value) => {
    if (!value || value < 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Extract tract data using field mappings
  const tractName = tractData?.[fieldMappings.tract.name] || 'Unknown';
  const tractCounty = tractData?.[fieldMappings.tract.county] || 'Unknown';
  const tractState = tractData?.[fieldMappings.tract.state] || 'Unknown';
  const medianRent = tractData?.[fieldMappings.tract.medianContractRent];
  const medianHomeValue = tractData?.[fieldMappings.tract.medianHomeValue];
  const medianIncome = tractData?.[fieldMappings.tract.medianIncome];
  
  infoDiv.innerHTML = `
    <h2>Census Tract Information</h2>
    <p>Location: <strong>${lat.toFixed(4)}, ${lon.toFixed(4)}</strong></p>
    <p>Tract: <strong>${tractName}</strong></p>
    <p>County: <strong>${tractCounty}</strong></p>
    <p>State: <strong>${tractState}</strong></p>
    <hr>
    
    <h3>Housing & Income Comparison</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #e9ecef;">
          <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Metric</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">This Tract</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${tractState} State</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border: 1px solid #dee2e6;">Median Contract Rent</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(medianRent)}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(stateData1?.[fieldMappings.state1.medianContractRent])}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 8px; border: 1px solid #dee2e6;">Median Home Value</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(medianHomeValue)}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(stateData1?.[fieldMappings.state1.medianHomeValue])}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #dee2e6;">Median Household Income</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(medianIncome)}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">${formatCurrency(stateData1?.[fieldMappings.state1.medianIncome])}</td>
        </tr>
      </tbody>
    </table>
    
    <h3>Additional State Data</h3>
    <p>Percent Renters Spending More Than 30%: <strong>${formatPercent(stateData2?.[fieldMappings.state2.pctRentersSpendingMoreThan30Pct])}</strong></p>
    <p>Percent Owners Spending More Than 30%: <strong>${formatPercent(stateData2?.[fieldMappings.state2.pctOwnersSpendingMoreThan30Pct])}</strong></p>
  `;
  
  return infoDiv;
};

/**
 * Display a friendly message when no census data is found
 * @param {number[]} latLon - Array containing latitude and longitude coordinates
 */
export const createNoDataMessageCard = (latLon) => {
  const lat = latLon[0];
  const lon = latLon[1];
  const noDataDiv = document.createElement('div');
  noDataDiv.style.cssText = `
    padding: 20px;
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
 * @param {number[]} latLon - Array containing latitude and longitude coordinates
 * @param {Error} error - Error object with message
 */
export const displayErrorMessage = (latLon, error) => {
  const lat = latLon[0];
  const lon = latLon[1];
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