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
        
        const complaintHeatData = complaints
            .filter(c => c.latitude && c.longitude && c.latitude !== '' && c.longitude !== '')
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
                    console.warn('Invalid coordinates for complaint:', c);
                    return null;
                }
                
                console.log(`Complaint: ${c.title} - Status: ${c.status} - Intensity: ${intensity} - Lat: ${lat}, Lng: ${lng}`);
                return [lat, lng, intensity];
            })
            .filter(point => point !== null); // Remove invalid points
        
        if (complaintHeatData.length > 0) {
            console.log(`Successfully loaded ${complaintHeatData.length} valid complaint locations`);
            return complaintHeatData;
        } else {
            console.log('No valid complaint coordinates found');
            return [];
        }
    } catch (error) {
        console.error('Error loading complaint data:', error);
        return [];
    }
}

// Function to update the heatmap with current data
function updateHeatmapWithComplaintData() {
    const freshData = loadComplaintData();
    if (freshData.length > 0) {
        const newCombined = [...freshData, ...heatData];
        currentData = newCombined.concat(generateDenseData(newCombined, 40));
        updateHeat(currentData);
        console.log(`Heatmap updated with ${freshData.length} real complaint locations`);
        
        // Update the stats display
        updateStatsDisplay(freshData);
    } else {
        // Use only sample data if no real complaints
        currentData = heatData.concat(generateDenseData(heatData, 80));
        updateHeat(currentData);
        console.log('Using sample data - no real complaints found');
        updateStatsDisplay([]);
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
}

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
    // Load real complaint data
    const realComplaintData = loadComplaintData();
    
    // Combine real data with sample data
    const combinedData = realComplaintData.length > 0 
        ? [...realComplaintData, ...heatData] 
        : heatData;

    // Start with expanded data so the initial map looks "deep"
    currentData = combinedData.concat(generateDenseData(combinedData, 80));

    // Create heatmap layer
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
}

// Initialize the map with real data
let currentData;
let heat;

// Call initialize function when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});

// default heatmap visual options
function makeHeatOptions() {
    return {
        radius: Number(document.getElementById('radius')?.value || 30), // Increased default radius
        blur: Number(document.getElementById('blur')?.value || 20), // Increased blur
        maxZoom: 17,
        max: Number(document.getElementById('max')?.value || 1.5), // Increased max intensity
        minOpacity: Number(document.getElementById('minOpacity')?.value || 0.6), // Increased min opacity
        gradient: {
            0.0: 'rgba(0, 255, 255, 0.2)',  // Cyan (transparent)
            0.2: 'rgba(0, 255, 0, 0.4)',    // Green
            0.4: 'rgba(255, 255, 0, 0.6)',   // Yellow
            0.6: 'rgba(255, 165, 0, 0.8)',   // Orange
            0.8: 'rgba(255, 69, 0, 0.9)',    // Red-Orange
            1.0: 'rgba(255, 0, 0, 1.0)'      // Red (opaque)
        }
    };
}

// update heat layer by removing and re-adding with new options or data
function updateHeat(newData) {
    if (heat) map.removeLayer(heat);
    heat = L.heatLayer(newData || currentData, makeHeatOptions()).addTo(map);
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

// Add real-time data refresh
setInterval(() => {
    updateHeatmapWithComplaintData();
}, 30000); // Refresh every 30 seconds

// Listen for storage changes (when new complaints are added from other tabs)
window.addEventListener('storage', function(e) {
    if (e.key === 'complaints') {
        console.log('Complaint data updated in another tab, refreshing heatmap');
        updateHeatmapWithComplaintData();
    }
});
