export const API_BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

console.log("🔧 API Base URL:", API_BASE_URL);
console.log("🧪 Demo mode:", window.location.hostname.includes("github.io"));