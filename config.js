// This file will fetch the API key from an environment variable or a secure endpoint
const CONFIG = {
    // The API key will be populated at runtime
    GEMINI_API_KEY: null,
    
    // Initialize the config
    async init() {
        try {
            // In production, fetch from the secure endpoint
            const response = await fetch('https://heroic-lamington-f62f1e.netlify.app/');
            const data = await response.json();
            this.GEMINI_API_KEY = data.apiKey;
            return true;
        } catch (error) {
            console.error('Failed to fetch API key:', error);
            return false;
        }
    }
};