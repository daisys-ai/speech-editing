// Daisys API Integration
class DaisysAPI {
    constructor() {
        // Load tokens from localStorage on initialization
        this.loadTokens();
        
        // Use config for URLs
        this.apiUrl = window.config.DAISYS_API_URL;
        this.authUrl = window.config.DAISYS_AUTH_URL;
        this.mockMode = window.config.MOCK_MODE;
    }
    
    // Load tokens from localStorage
    loadTokens() {
        const accessToken = localStorage.getItem('daisys_access_token');
        const refreshToken = localStorage.getItem('daisys_refresh_token');
        const username = localStorage.getItem('daisys_username');
        
        // Ensure we don't store "undefined" as a string
        this.accessToken = (accessToken && accessToken !== 'undefined') ? accessToken : null;
        this.refreshToken = (refreshToken && refreshToken !== 'undefined') ? refreshToken : null;
        this.username = (username && username !== 'undefined') ? username : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        console.log('Checking login status, accessToken:', this.accessToken);
        const isValid = this.accessToken && this.accessToken !== 'undefined' && this.accessToken !== 'null';
        console.log('isLoggedIn result:', isValid);
        return isValid;
    }

    // Login to Daisys
    async login(email, password) {
        try {
            // Check if mock mode is enabled
            if (this.mockMode) {
                console.log('Mock mode enabled, using mock authentication');
                this.accessToken = window.config.MOCK_TOKEN;
                this.username = email;
                localStorage.setItem('daisys_access_token', window.config.MOCK_TOKEN);
                localStorage.setItem('daisys_username', email);
                return { success: true, username: email };
            }
            
            console.log('Attempting login with email:', email);
            console.log('Using auth URL:', this.authUrl);
            
            const response = await fetch(`${this.authUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Login failed with response:', errorText);
                throw new Error(`Login failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Login successful, received data:', data);
            
            // Store tokens - check different possible response formats
            const accessToken = data.access || data.access_token || data.accessToken;
            const refreshToken = data.refresh || data.refresh_token || data.refreshToken;
            
            console.log('Extracted tokens - access:', accessToken, 'refresh:', refreshToken);
            
            if (accessToken) {
                this.accessToken = accessToken;
                localStorage.setItem('daisys_access_token', accessToken);
                console.log('Stored access token:', this.accessToken);
            } else {
                console.error('No access token found in response!');
            }
            
            if (refreshToken) {
                this.refreshToken = refreshToken;
                localStorage.setItem('daisys_refresh_token', refreshToken);
            }
            
            this.username = email;
            localStorage.setItem('daisys_username', email);
            
            return { success: true, username: email };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.username = null;
        
        localStorage.removeItem('daisys_access_token');
        localStorage.removeItem('daisys_refresh_token');
        localStorage.removeItem('daisys_username');
    }
    
    // Clear invalid tokens
    clearInvalidTokens() {
        const items = ['daisys_access_token', 'daisys_refresh_token'];
        items.forEach(key => {
            const value = localStorage.getItem(key);
            if (value === 'undefined' || value === 'null' || !value) {
                localStorage.removeItem(key);
            }
        });
        this.loadTokens();
    }

    // Get or create a voice for infilling-en model
    async getOrCreateVoice() {
        try {
            // If using mock mode, return mock voice ID
            if (this.mockMode) {
                console.log('Mock mode: Using mock voice ID');
                return 'mock_voice_id';
            }
            
            // First, try to get existing voices
            const voicesResponse = await fetch(`${this.apiUrl}/v1/speak/voices`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!voicesResponse.ok) {
                throw new Error('Failed to fetch voices');
            }

            const voices = await voicesResponse.json();
            
            // Look for an infilling-en voice
            const infillingVoice = voices.find(v => v.model === 'infilling-en');
            
            if (infillingVoice) {
                return infillingVoice.id;
            }

            // Create a new voice for infilling-en
            const createResponse = await fetch(`${this.apiUrl}/v1/speak/voices/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Default Infilling Voice',
                    gender: 'male',
                    model: 'infilling-en'
                })
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create voice');
            }

            const newVoice = await createResponse.json();
            return newVoice.id;
        } catch (error) {
            console.error('Voice error:', error);
            throw error;
        }
    }

    // Generate TTS with timing information
    async generateTTS(text, voiceId, phonemeDurations) {
        try {
            // If using mock mode, return mock data
            if (this.mockMode) {
                console.log('Mock mode: Using mock TTS generation');
                return {
                    takeId: 'mock_take_' + Date.now(),
                    audioUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=', // Silent audio
                    duration: 2.5,
                    normalizedText: text
                };
            }
            
            console.log('Generating TTS with token:', this.accessToken);
            
            // Ensure we have a valid token
            if (!this.accessToken || this.accessToken === 'undefined') {
                throw new Error('No valid access token available');
            }
            
            // Format the text with prosody controls based on durations
            const formattedText = this.formatTextWithProsody(text, phonemeDurations);
            
            const response = await fetch(`${this.apiUrl}/v1/speak/takes/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice_id: voiceId,
                    text: formattedText,
                    format: 'mp3'
                })
            });

            if (!response.ok) {
                throw new Error('TTS generation failed');
            }

            const data = await response.json();
            
            // The API returns a take_id and audio_url
            return {
                takeId: data.take_id,
                audioUrl: data.audio_url,
                duration: data.duration,
                normalizedText: data.normalized_text
            };
        } catch (error) {
            console.error('TTS error:', error);
            throw error;
        }
    }

    // Format text with prosody controls
    formatTextWithProsody(text, phonemeDurations) {
        // For now, return the text as-is
        // In a real implementation, we would use SSML-like tags
        // to control the duration of individual phonemes
        return text;
    }

    // Refresh access token
    async refreshAccessToken() {
        try {
            const response = await fetch(`${this.authUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: this.refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.accessToken = data.access;
            localStorage.setItem('daisys_access_token', data.access);
            
            return true;
        } catch (error) {
            console.error('Refresh error:', error);
            return false;
        }
    }
}

// Export for use in main app
window.DaisysAPI = DaisysAPI;
