// Initialize the map
const map = L.map('mapid').setView([20, 0], 2); // Centered globally, zoom level 2

// 2. Add a dark Tile Layer (to match the image's dark theme)
// Using an OpenStreetMap Dark CartoDB layer as an example
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18
}).addTo(map);

// 3. Base sample data points (Latitude, Longitude, Intensity)
const heatData = [
    [34.0522, -118.2437, 1.0], // Los Angeles
    [40.7128, -74.0060, 0.9],  // New York
    [30.2672, -97.7431, 1.0],  // Austin
    [51.5074, 0.1278, 0.8],    // London
    [48.8566, 2.3522, 0.9],    // Paris
    [52.5200, 13.4050, 0.7],   // Berlin
    [35.6895, 139.6917, 1.0],  // Tokyo
    [39.9042, 116.4074, 0.9],  // Beijing
    [28.7041, 77.1025, 0.8],   // Delhi
    [-22.9068, -43.1729, 0.4], // Rio de Janeiro
    [-34.6037, -58.3816, 0.3], // Buenos Aires
    [-33.8688, 151.2093, 0.7], // Sydney
];

// Helper: generate many jittered points around base points to "deepen" the heatmap
function generateDenseData(basePoints, perPoint = 60) {
    const dense = [];
    basePoints.forEach(p => {
        const [lat, lng, intensity] = p;
        for (let i = 0; i < perPoint; i++) {
            // jitter depends on zoom-scale / intensity so hotspots cluster
            const jitter = (Math.random() - 0.5) * (0.8 + (1 - intensity));
            const latJ = lat + jitter * (0.5 / (Math.abs(lat) + 1));
            const lngJ = lng + jitter * (0.5 / (Math.abs(lng) + 1));
            const w = Math.max(0.05, intensity * (0.4 + Math.random() * 1.6));
            dense.push([latJ, lngJ, w]);
        }
    });
    return dense;
}

// Load real complaint data from localStorage if available
function loadComplaintData() {
    try {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        console.log(`Found ${complaints.length} complaints in localStorage`);
        
        // Debug: Log all complaints to see their structure
        console.log('Complaints structure:', complaints);
        
        const complaintHeatData = complaints
            .filter(c => {
                // Check for valid coordinates
                const hasCoords = c.latitude && c.longitude && 
                                 c.latitude !== '' && 
                                 c.longitude !== '' &&
                                 c.latitude !== null &&
                                 c.longitude !== null;
                
                if (!hasCoords) {
                    console.log('Skipping complaint - no coordinates:', c.title || 'Untitled');
                }
                return hasCoords;
            })
            .map(c => {
                const lat = parseFloat(c.latitude);
                const lng = parseFloat(c.longitude);
                
                // Set intensity based on complaint status
                let intensity;
                switch(c.status) {
                    case 'pending':
                        intensity = 1.0; // Highest intensity - RED
                        break;
                    case 'in_progress':
                        intensity = 0.8; // High intensity - ORANGE
                        break;
                    case 'resolved':
                        intensity = 0.4; // Lower intensity - GREEN/YELLOW
                        break;
                    case 'rejected':
                        intensity = 0.3; // Lowest intensity - CYAN
                        break;
                    default:
                        intensity = 0.6; // Medium intensity
                }
                
                // Validate coordinates
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn('Invalid coordinates for complaint:', c.title, 'Lat:', lat, 'Lng:', lng);
                    return null;
                }
                
                console.log(`✅ Real complaint: ${c.title} - Status: ${c.status} - Intensity: ${intensity} - Lat: ${lat}, Lng: ${lng}`);
                return [lat, lng, intensity];
            })
            .filter(point => point !== null); // Remove invalid points
        
        if (complaintHeatData.length > 0) {
            console.log(`✅ Successfully loaded ${complaintHeatData.length} valid complaint locations for heatmap`);
            console.log('Heatmap points:', complaintHeatData);
            return complaintHeatData;
        } else {
            console.log('❌ No valid complaint coordinates found for heatmap');
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading complaint data:', error);
        return [];
    }
}

// Function to update the heatmap with current data
function updateHeatmapWithComplaintData() {
    const freshData = loadComplaintData();
    console.log(`🔥 Updating heatmap with ${freshData.length} real complaints`);
    
    if (freshData.length > 0) {
        // Use ONLY real data - NO background heat or dense generation
        currentData = freshData;
        
        // Update heatmap with precise options for real data only
        updateHeat(currentData);
        
        // Clear existing markers and add new ones
        clearMarkers();
        addComplaintMarkers(freshData);
        
        // Center map on real complaints
        const bounds = L.latLngBounds(freshData.map(point => [point[0], point[1]]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        console.log(`🔥 Heatmap updated with ${freshData.length} real complaint locations ONLY - no background heat`);
        
        // Update the stats display
        updateStatsDisplay(freshData);
    } else {
        // Use minimal sample data if no real complaints
        console.log('❌ No real complaints found, using minimal sample data');
        currentData = heatData; // Just basic sample points, no dense generation
        updateHeat(currentData);
        clearMarkers();
        updateStatsDisplay([]);
    }
}

// Clear all markers from the map
function clearMarkers() {
    try {
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        console.log('Cleared all markers from map');
    } catch (error) {
        console.error('Error clearing markers:', error);
    }
}

// Update statistics display
function updateStatsDisplay(complaintData) {
    const totalLocationsEl = document.getElementById('total-locations');
    const hotspotsEl = document.getElementById('hotspots');
    const resolvedEl = document.getElementById('resolved-areas');
    
    if (totalLocationsEl) totalLocationsEl.textContent = complaintData.length;
    if (hotspotsEl) hotspotsEl.textContent = complaintData.filter(p => p[2] >= 0.8).length;
    if (resolvedEl) resolvedEl.textContent = complaintData.filter(p => p[2] <= 0.5).length;
    
    // Update data info panel
    updateDataInfoPanel(complaintData);
}

// Update data info panel
function updateDataInfoPanel(complaintData) {
    try {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        
        // Update data source
        const dataSourceEl = document.getElementById('data-source');
        if (dataSourceEl) {
            dataSourceEl.textContent = complaintData.length > 0 ? 'Real Complaint Data' : 'Sample Data';
            dataSourceEl.style.color = complaintData.length > 0 ? '#10b981' : '#f59e0b';
        }
        
        // Update last updated time
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            const now = new Date();
            lastUpdatedEl.textContent = now.toLocaleTimeString();
        }
        
        // Update complaints found
        const complaintsFoundEl = document.getElementById('complaints-found');
        if (complaintsFoundEl) {
            complaintsFoundEl.textContent = complaints.length;
        }
        
        // Update valid locations
        const validLocationsEl = document.getElementById('valid-locations');
        if (validLocationsEl) {
            validLocationsEl.textContent = complaintData.length;
        }
        
        console.log('Data info panel updated');
    } catch (error) {
        console.error('Error updating data info panel:', error);
    }
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add refresh button event listener
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Manual refresh triggered');
            updateHeatmapWithComplaintData();
        });
    }
});

// Function to get complaint details for popup
function getComplaintDetails(lat, lng) {
    try {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const complaint = complaints.find(c => 
            Math.abs(parseFloat(c.latitude) - lat) < 0.0001 && 
            Math.abs(parseFloat(c.longitude) - lng) < 0.0001
        );
        
        if (complaint) {
            return `
                <div style="background: #1a2033; color: white; padding: 10px; border-radius: 5px; border: 1px solid #333;">
                    <h4 style="margin: 0 0 5px 0; color: #fff;">${complaint.title || 'Untitled Complaint'}</h4>
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #ccc;">${complaint.description || 'No description'}</p>
                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #999;">Status: <span style="color: ${getStatusColor(complaint.status)}">${complaint.status || 'unknown'}</span></p>
                    <p style="margin: 0; font-size: 11px; color: #999;">Location: ${complaint.location || 'Unknown'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error getting complaint details:', error);
    }
    return '<div style="background: #1a2033; color: white; padding: 10px; border-radius: 5px;">No details available</div>';
}

function getStatusColor(status) {
    switch(status) {
        case 'pending': return '#ef4444'; // Red for pending
        case 'in_progress': return '#f59e0b'; // Orange for in progress
        case 'resolved': return '#10b981'; // Green for resolved
        case 'rejected': return '#6b7280'; // Gray for rejected
        default: return '#6b7280';
    }
}

// Initialize map with real data
function initializeMap() {
    console.log('🗺️ Initializing heatmap map...');
    
    // Load real complaint data
    const realComplaintData = loadComplaintData();
    
    console.log(`🗺️ Initializing map with ${realComplaintData.length} real complaints`);
    
    // If we have real data, use ONLY real data - no sample data
    if (realComplaintData.length > 0) {
        console.log('✅ Using ONLY real complaint data for heatmap');
        
        // Calculate bounds to center map on real complaints
        const bounds = L.latLngBounds(realComplaintData.map(point => [point[0], point[1]]));
        
        // Use ONLY real complaint data - NO background/sample heat
        currentData = realComplaintData;
        
        // Fit map to show all complaints
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Add markers for each complaint location
        addComplaintMarkers(realComplaintData);
        
        console.log(`✅ Map initialized with ${realComplaintData.length} real complaints ONLY - no background heat`);
    } else {
        // Only show sample data if absolutely no real complaints exist
        console.log('❌ No real complaints found, using minimal sample data for demonstration');
        currentData = heatData; // No dense generation - just basic sample points
    }

    // Create heatmap layer with precise options for real data
    heat = L.heatLayer(currentData, makeHeatOptions()).addTo(map);
    
    // Update stats
    updateStatsDisplay(realComplaintData);
    
    // Add click event to show complaint details
    map.on('click', function(e) {
        const clickLat = e.latlng.lat;
        const clickLng = e.latlng.lng;
        
        // Find nearest complaint point
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const nearestComplaint = complaints.find(c => {
            const lat = parseFloat(c.latitude);
            const lng = parseFloat(c.longitude);
            return Math.abs(lat - clickLat) < 0.01 && Math.abs(lng - clickLng) < 0.01;
        });
        
        if (nearestComplaint) {
            const popup = L.popup()
                .setLatLng(e.latlng)
                .setContent(getComplaintDetails(clickLat, clickLng))
                .openOn(map);
        }
    });
    
    console.log('🗺️ Map initialization complete');
}

// Add markers for complaint locations
function addComplaintMarkers(complaintData) {
    try {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        
        complaints.forEach(complaint => {
            const lat = parseFloat(complaint.latitude);
            const lng = parseFloat(complaint.longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && complaint.latitude && complaint.longitude) {
                // Create custom icon based on status
                const iconColor = getStatusIconColor(complaint.status);
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background-color: ${iconColor};
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                
                // Add marker to map
                const marker = L.marker([lat, lng], { icon: icon }).addTo(map);
                
                // Add popup to marker
                marker.bindPopup(getComplaintDetails(lat, lng));
                
                console.log(`Added marker for complaint: ${complaint.title} at [${lat}, ${lng}]`);
            }
        });
    } catch (error) {
        console.error('Error adding complaint markers:', error);
    }
}

// Get icon color based on complaint status
function getStatusIconColor(status) {
    switch(status) {
        case 'pending': return '#ef4444'; // Red
        case 'in_progress': return '#f59e0b'; // Orange
        case 'resolved': return '#10b981'; // Green
        case 'rejected': return '#6b7280'; // Gray
        default: return '#3b82f6'; // Blue
    }
}

// Dynamic heatmap variables
let autoRefreshInterval;
let isAutoRefreshEnabled = true;
let lastUpdateTime = null;
let updateCounter = 0;

// Dynamic heatmap initialization
function initializeDynamicHeatmap() {
    console.log('🔄 Initializing dynamic heatmap...');
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Listen for storage changes (cross-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Add dynamic controls
    addDynamicControls();
    
    console.log('✅ Dynamic heatmap initialized');
}

// Auto-refresh functionality
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    if (isAutoRefreshEnabled) {
        autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-refresh triggered...');
            updateHeatmapWithComplaintData();
            updateLastRefreshTime();
            showLiveUpdateIndicator('Auto-refreshed');
        }, 5000); // Refresh every 5 seconds for more visible updates
        
        console.log('🔄 Auto-refresh started (5 seconds interval)');
        showNotification('Auto-refresh enabled (5s)', 'success');
    }
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏸️ Auto-refresh stopped');
    }
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    
    if (isAutoRefreshEnabled) {
        startAutoRefresh();
        showNotification('Auto-refresh enabled', 'success');
    } else {
        stopAutoRefresh();
        showNotification('Auto-refresh disabled', 'warning');
    }
    
    updateAutoRefreshButton();
}

// Handle storage changes (when complaints are added/updated from other tabs)
function handleStorageChange(e) {
    if (e.key === 'complaints') {
        console.log('🔄 Storage change detected, updating heatmap...');
        updateHeatmapWithComplaintData();
        updateLastRefreshTime();
        showNotification('Data updated from another tab', 'info');
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Press 'R' to refresh
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        updateHeatmapWithComplaintData();
        showNotification('Heatmap refreshed', 'success');
    }
    
    // Press 'Space' to toggle auto-refresh
    if (e.key === ' ') {
        e.preventDefault();
        toggleAutoRefresh();
    }
    
    // Press 'F' for fullscreen
    if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
    }
}

// Add dynamic controls to the UI
function addDynamicControls() {
    const controlsContainer = document.getElementById('heat-controls');
    if (!controlsContainer) return;
    
    // Create dynamic controls section
    const dynamicControls = document.createElement('div');
    dynamicControls.className = 'dynamic-controls';
    dynamicControls.innerHTML = `
        <div class="auto-refresh-control">
            <button id="auto-refresh-toggle" class="auto-refresh-btn active">
                🔄 Auto-Refresh: ON
            </button>
            <span id="last-update-time" class="last-update">Never updated</span>
        </div>
        <div class="quick-actions">
            <button id="fullscreen-toggle" class="action-btn">⛶ Fullscreen</button>
            <button id="export-data" class="action-btn">📊 Export</button>
            <button id="clear-data" class="action-btn">🗑️ Clear</button>
        </div>
    `;
    
    controlsContainer.appendChild(dynamicControls);
    
    // Add event listeners
    document.getElementById('auto-refresh-toggle').addEventListener('click', toggleAutoRefresh);
    document.getElementById('fullscreen-toggle').addEventListener('click', toggleFullscreen);
    document.getElementById('export-data').addEventListener('click', exportHeatmapData);
    document.getElementById('clear-data').addEventListener('click', clearHeatmapData);
}

// Update auto-refresh button state
function updateAutoRefreshButton() {
    const button = document.getElementById('auto-refresh-toggle');
    if (button) {
        if (isAutoRefreshEnabled) {
            button.textContent = '🔄 Auto-Refresh: ON';
            button.className = 'auto-refresh-btn active';
        } else {
            button.textContent = '⏸️ Auto-Refresh: OFF';
            button.className = 'auto-refresh-btn inactive';
        }
    }
}

// Update last refresh time
function updateLastRefreshTime() {
    lastUpdateTime = new Date();
    updateCounter++;
    
    const timeElement = document.getElementById('last-update-time');
    if (timeElement) {
        timeElement.textContent = `Updated: ${lastUpdateTime.toLocaleTimeString()} (#${updateCounter})`;
    }
    
    // Also update the info panel
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = lastUpdateTime.toLocaleTimeString();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showNotification('Fullscreen mode', 'info');
    } else {
        document.exitFullscreen();
        showNotification('Exited fullscreen', 'info');
    }
}

// Export heatmap data
function exportHeatmapData() {
    try {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const exportData = {
            timestamp: new Date().toISOString(),
            totalComplaints: complaints.length,
            complaints: complaints.map(c => ({
                title: c.title,
                status: c.status,
                latitude: c.latitude,
                longitude: c.longitude,
                location: c.location,
                date: c.date
            }))
        };
        
        // Create download link
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed', 'error');
    }
}

// Enhanced update function with visible changes
function updateHeatmapWithComplaintData() {
    const freshData = loadComplaintData();
    console.log(`🔄 Dynamic update with ${freshData.length} real complaints`);
    
    // Always show update indicator
    showLiveUpdateIndicator(`${freshData.length} complaints`);
    
    if (freshData.length > 0) {
        // Use ONLY real data - NO background heat
        currentData = freshData;
        
        // Update heatmap with smooth transition
        updateHeat(currentData);
        
        // Clear existing markers and add new ones
        clearMarkers();
        addComplaintMarkers(freshData);
        
        // Center map on real complaints with smooth animation
        const bounds = L.latLngBounds(freshData.map(point => [point[0], point[1]]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { 
                padding: [50, 50],
                animate: true,
                duration: 1
            });
        }
        
        console.log(`🔄 Dynamic update completed: ${freshData.length} real complaint locations`);
        
        // Update the stats display
        updateStatsDisplay(freshData);
        
        // Flash the map to show update
        flashMapUpdate();
    } else {
        // Use minimal sample data if no real complaints
        console.log('❌ No real complaints found, using minimal sample data');
        currentData = heatData;
        updateHeat(currentData);
        clearMarkers();
        updateStatsDisplay([]);
    }
}

// Flash map to show update occurred
function flashMapUpdate() {
    const mapContainer = document.getElementById('mapid');
    if (mapContainer) {
        mapContainer.style.transition = 'opacity 0.3s';
        mapContainer.style.opacity = '0.7';
        setTimeout(() => {
            mapContainer.style.opacity = '1';
        }, 300);
    }
}

// Enhanced live update indicator
function showLiveUpdateIndicator(count) {
    // Remove existing indicator
    const existing = document.querySelector('.live-update-indicator');
    if (existing) {
        existing.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'live-update-indicator';
    indicator.innerHTML = `🔄 Live: ${count}`;
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9em;
        z-index: 9999;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: pulse 1s infinite;
    `;
    
    document.body.appendChild(indicator);
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Clear heatmap data
function clearHeatmapData() {
    if (confirm('Are you sure you want to clear all complaint data? This cannot be undone.')) {
        localStorage.removeItem('complaints');
        updateHeatmapWithComplaintData();
        showNotification('All data cleared', 'warning');
    }
}

// Call initialize function when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeDynamicHeatmap(); // Initialize dynamic features
});

// update heat layer by removing and re-adding with new options or data
function updateHeat(newData) {
    if (heat) map.removeLayer(heat);
    heat = L.heatLayer(newData || currentData, makeHeatOptions()).addTo(map);
}

// default heatmap visual options
function makeHeatOptions() {
    return {
        radius: Number(document.getElementById('radius')?.value || 25), // Smaller radius for precise points
        blur: Number(document.getElementById('blur')?.value || 15), // Less blur for sharper points
        maxZoom: 17,
        max: Number(document.getElementById('max')?.value || 1.0), // Standard intensity
        minOpacity: Number(document.getElementById('minOpacity')?.value || 0.8), // Higher opacity for visibility
        gradient: {
            0.0: 'rgba(0, 255, 255, 0.2)',  // Cyan (very transparent)
            0.3: 'rgba(0, 255, 0, 0.4)',    // Green
            0.5: 'rgba(255, 255, 0, 0.6)',   // Yellow
            0.7: 'rgba(255, 165, 0, 0.8)',   // Orange
            0.9: 'rgba(255, 69, 0, 0.9)',    // Red-Orange
            1.0: 'rgba(255, 0, 0, 1.0)'      // Red (fully opaque)
        }
    };
}

// Wire UI controls (if present)
const radiusEl = document.getElementById('radius');
const blurEl = document.getElementById('blur');
const maxEl = document.getElementById('max');
const minOpacityEl = document.getElementById('minOpacity');
const regenBtn = document.getElementById('regen');
const backBtn = document.getElementById('back-to-dashboard');

if (radiusEl) radiusEl.addEventListener('input', () => updateHeat());
if (blurEl) blurEl.addEventListener('input', () => updateHeat());
if (maxEl) maxEl.addEventListener('input', () => updateHeat());
if (minOpacityEl) minOpacityEl.addEventListener('input', () => updateHeat());
if (regenBtn) regenBtn.addEventListener('click', () => {
    // regenerate a denser dataset (user can call repeatedly for different random seeds)
    updateHeatmapWithComplaintData();
});

if (backBtn) {
    backBtn.addEventListener('click', () => {
        // Go back to the main app
        window.location.href = '/';
    });
}

// small UX: make legend colors match the gradient used above
const legendBar = document.querySelector('.legend-bar');
if (legendBar) {
    legendBar.style.background = 'linear-gradient(90deg, cyan, lime, yellow, orange, red)';
}
