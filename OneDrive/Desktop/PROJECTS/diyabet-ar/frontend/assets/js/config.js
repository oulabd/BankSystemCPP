// API Configuration - Environment-based URL setup
// This can be overridden by setting window.API_BASE_URL before loading this script
const API_URL = window.API_BASE_URL || 'http://localhost:3001';
window.API_BASE_URL = API_URL;
window.API_BASE = API_URL + '/api';

// MapTiler API key configuration
// Replace YOUR_KEY_HERE with your MapTiler API key
window.MAPTILER_KEY = window.MAPTILER_KEY || 'YOUR_KEY_HERE';
