// Configuration loader for Daisys API
class Config {
    constructor() {
        // Default values
        this.DAISYS_API_URL = 'https://api.daisys.ai';
        this.DAISYS_AUTH_URL = 'https://api.daisys.ai';
        this.MOCK_MODE = false;
        this.MOCK_USERNAME = 'test@example.com';
        this.MOCK_TOKEN = 'mock_token_for_testing';
        
        // Load from window.ENV if available (injected by server)
        if (window.ENV) {
            this.DAISYS_API_URL = window.ENV.DAISYS_API_URL || this.DAISYS_API_URL;
            this.DAISYS_AUTH_URL = window.ENV.DAISYS_AUTH_URL || this.DAISYS_AUTH_URL;
            this.MOCK_MODE = window.ENV.MOCK_MODE === 'true';
            this.MOCK_USERNAME = window.ENV.MOCK_USERNAME || this.MOCK_USERNAME;
            this.MOCK_TOKEN = window.ENV.MOCK_TOKEN || this.MOCK_TOKEN;
        }
        
        // Allow URL parameters to override for testing
        const params = new URLSearchParams(window.location.search);
        if (params.get('mock') === 'true') {
            this.MOCK_MODE = true;
        }
        if (params.get('api_url')) {
            this.DAISYS_API_URL = params.get('api_url');
        }
        if (params.get('auth_url')) {
            this.DAISYS_AUTH_URL = params.get('auth_url');
        }
        
        console.log('Config loaded:', {
            DAISYS_API_URL: this.DAISYS_API_URL,
            DAISYS_AUTH_URL: this.DAISYS_AUTH_URL,
            MOCK_MODE: this.MOCK_MODE
        });
    }
}

// Export config instance
window.config = new Config();