// API Configuration for Docker environment
// The frontend runs in the browser, so it always uses the host's localhost
// In Docker setup, both frontend and backend are exposed on localhost with different ports
const getBaseURL = () => {
  // Since frontend JavaScript runs in browser, always use localhost
  // Backend is accessible viafrom the browser's perspective
  return "http://localhost:3002";
};

export const API_BASE_URL = getBaseURL();

console.log('🔧 API Base URL:', API_BASE_URL);