// Daisys API Integration
class DaisysAPI {
    constructor() {
        // Load tokens from localStorage on initialization
        this.loadTokens();
        
        // Use config for URLs
        this.apiUrl = window.config.DAISYS_API_URL;
        this.authUrl = window.config.DAISYS_AUTH_URL;
        this.mockMode = window.config.MOCK_MODE;
        
        // Store voice ID
        this.voiceId = localStorage.getItem('daisys_voice_id');
        
        // Voice creation state
        this.isCreatingVoice = false;
    }
    
    // Load tokens from localStorage
    loadTokens() {
        const accessToken = localStorage.getItem('daisys_access_token');
        const refreshToken = localStorage.getItem('daisys_refresh_token');
        const username = localStorage.getItem('daisys_username');
        const voiceId = localStorage.getItem('daisys_voice_id');
        
        // Ensure we don't store "undefined" as a string
        this.accessToken = (accessToken && accessToken !== 'undefined') ? accessToken : null;
        this.refreshToken = (refreshToken && refreshToken !== 'undefined') ? refreshToken : null;
        this.username = (username && username !== 'undefined') ? username : null;
        this.voiceId = (voiceId && voiceId !== 'undefined') ? voiceId : null;
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
            
            // Don't create voice here - we'll do it after login completes
            // so we can show proper UI feedback
            return { success: true, username: email, needsVoice: !this.voiceId };
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
        this.voiceId = null;
        
        localStorage.removeItem('daisys_access_token');
        localStorage.removeItem('daisys_refresh_token');
        localStorage.removeItem('daisys_username');
        localStorage.removeItem('daisys_voice_id');
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
            this.isCreatingVoice = true;
            
            // If using mock mode, return mock voice ID
            if (this.mockMode) {
                console.log('Mock mode: Using mock voice ID');
                // Simulate a delay for mock mode
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.isCreatingVoice = false;
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

            const voicesData = await voicesResponse.json();
            console.log('Voices response:', voicesData);
            
            // The response might be an array or have a voices property
            const voices = Array.isArray(voicesData) ? voicesData : (voicesData.voices || voicesData.data || []);
            console.log('Extracted voices array:', voices);
            
            // Look for an infilling-en voice
            const infillingVoice = voices.find(v => v.model === 'infilling-en');
            console.log('Found infilling voice:', infillingVoice);
            
            if (infillingVoice) {
                this.isCreatingVoice = false;
                const voiceId = infillingVoice.id || infillingVoice.voice_id;
                console.log('Returning existing voice ID:', voiceId);
                return voiceId;
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
            console.log('Created new voice:', newVoice);
            this.isCreatingVoice = false;
            const voiceId = newVoice.id || newVoice.voice_id;
            console.log('Returning new voice ID:', voiceId);
            return voiceId;
        } catch (error) {
            console.error('Voice error:', error);
            this.isCreatingVoice = false;
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
            console.log('Using voice ID:', voiceId);
            
            // Ensure we have a valid token
            if (!this.accessToken || this.accessToken === 'undefined') {
                throw new Error('No valid access token available');
            }
            
            // Ensure we have a voice ID
            if (!voiceId) {
                throw new Error('No voice ID provided for TTS generation');
            }
            
            // Format the text with prosody controls based on durations
            const formattedText = this.formatTextWithProsody(text, phonemeDurations);
            
            const requestBody = {
                voice_id: voiceId,
                text: formattedText
            };
            
            // Optionally add prosody based on durations (future enhancement)
            // For now, we'll use default prosody
            
            console.log('TTS request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${this.apiUrl}/v1/speak/takes/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('TTS generation failed:', errorText);
                throw new Error(`TTS generation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('TTS response:', data);
            
            // The API might return different formats, so check for various possibilities
            const audioUrl = data.audio_url || data.audioUrl || data.url;
            const takeId = data.take_id || data.takeId || data.id;
            
            if (!audioUrl) {
                console.error('No audio URL in response:', data);
                throw new Error('No audio URL returned from TTS API');
            }
            
            return {
                takeId: takeId,
                audioUrl: audioUrl,
                duration: data.duration || data.audio_duration || 0,
                normalizedText: data.normalized_text || data.normalizedText || text
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
