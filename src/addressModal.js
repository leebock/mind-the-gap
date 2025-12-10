/**
 * Create and show a modal for address/place search with real-time candidate results
 * @param {Function} onSubmit - Callback function when location is selected, receives [lat, lon]
 * @param {Function} onCancel - Callback function when modal is cancelled
 * @param {string} apiKey - ArcGIS API key for geocoding service
 */
export const showAddressModal = (onSubmit, onCancel, apiKey) => {
  let currentAddress = '';
  let candidates = [];
  let debounceTimer = null;
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-sizing: border-box;
    padding: 20px;
    z-index: 1000;
    font-family: Arial, sans-serif;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background-color: #fff;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    position: relative;
  `;
  
  // Create form content
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 style="margin: 0; color: #333; font-size: 20px;">Place Locator</h2>
      <button id="close-btn" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    </div>
    
    <div style="margin-bottom: 20px;">
      <input 
        type="text" 
        id="address-input" 
        placeholder="Address or place name"
        style="
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        "
      />
    </div>
    
    <div id="candidates-container" style="
      margin-top: 16px;
      border-radius: 4px;
      overflow: hidden;
    "></div>
  `;
  
  const input = modal.querySelector('#address-input');
  const candidatesContainer = modal.querySelector('#candidates-container');
  const closeBtn = modal.querySelector('#close-btn');
  
  // Add input focus styling
  input.addEventListener('focus', () => {
    input.style.borderColor = '#007bff';
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = '#ddd';
  });
  
  // Fetch address candidates from ArcGIS REST API
  const fetchCandidates = async (address) => {
    if (!address || address.trim().length < 3) {
      candidates = [];
      renderCandidates();
      return;
    }
    
    console.log('Fetching candidates for:', address);
    
    try {
      const url = `https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=pjson&singleLine=${encodeURIComponent(address.trim())}&countryCode=USA&maxLocations=8&token=${apiKey}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      console.log('API response:', json);
      
      candidates = json.candidates || [];
      console.log('Candidates found:', candidates.length);
      renderCandidates();
    } catch (error) {
      console.error('Error fetching candidates:', error);
      candidates = [];
      renderCandidates();
    }
  };
  
  // Render candidate list
  const renderCandidates = () => {
    if (candidates.length === 0) {
      candidatesContainer.innerHTML = '';
      return;
    }
    
    const candidateButtons = candidates.map((candidate, index) => {
      return `
        <button 
          class="candidate-btn"
          data-address="${candidate.address}"
          data-x="${candidate.location.x}"
          data-y="${candidate.location.y}"
          style="
            display: flex;
            width: 100%;
            padding: 12px 16px;
            border: none;
            border-bottom: 1px solid #eee;
            background-color: #fff;
            text-align: left;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          "
          onmouseover="this.style.backgroundColor='#f8f9fa'"
          onmouseout="this.style.backgroundColor='#fff'"
        >
          ${candidate.address}
        </button>
      `;
    }).join('');
    
    candidatesContainer.innerHTML = `
      <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
        ${candidateButtons}
      </div>
    `;
    
    // Add click handlers to candidate buttons
    const buttons = candidatesContainer.querySelectorAll('.candidate-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (event) => {
        const x = parseFloat(event.currentTarget.getAttribute('data-x'));
        const y = parseFloat(event.currentTarget.getAttribute('data-y'));
        
        // Close modal and call onSubmit with [lat, lon]
        document.body.removeChild(overlay);
        onSubmit([y, x]); // lat, lon format to match your existing code
      });
    });
  };
  
  // Debounced address search
  const handleAddressChange = (newAddress) => {
    console.log('Address changed to:', newAddress);
    currentAddress = newAddress;
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      console.log('Debounce timer fired, fetching candidates...');
      fetchCandidates(currentAddress);
    }, 300); // 300ms debounce
  };
  
  // Handle input changes
  input.addEventListener('input', (e) => {
    console.log('Input event fired:', e.target.value);
    handleAddressChange(e.target.value);
  });
  
  // Handle cancel/close
  const handleCancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    document.body.removeChild(overlay);
    if (onCancel) onCancel();
  };
  
  // Event listeners
  closeBtn.addEventListener('click', handleCancel);
  
  // Handle Escape key
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  });
  
  // Close on overlay click (but not modal click)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      handleCancel();
    }
  });
  
  // Assemble and show modal
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus input after a brief delay to ensure it's rendered
  setTimeout(() => {
    input.focus();
  }, 100);
  
  return overlay;
};