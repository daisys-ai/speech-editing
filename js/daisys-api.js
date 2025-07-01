// Daisys API Integration
const DAISYS_API_BASE = 'https://api.daisys.ai';

class DaisysAPI {
    constructor() {
        this.accessToken = localStorage.getItem('daisys_access_token');
        this.refreshToken = localStorage.getItem('daisys_refresh_token');
        this.username = localStorage.getItem('daisys_username');
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.accessToken;
    }

    // Login to Daisys
    async login(email, password) {
        try {
            const response = await fetch(`${DAISYS_API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            
            // Store tokens
            this.accessToken = data.access;
            this.refreshToken = data.refresh;
            this.username = email;
            
            localStorage.setItem('daisys_access_token', data.access);
            localStorage.setItem('daisys_refresh_token', data.refresh);
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

    // Get or create a voice for infilling-en model
    async getOrCreateVoice() {
        try {
            // First, try to get existing voices
            const voicesResponse = await fetch(`${DAISYS_API_BASE}/v1/speak/voices`, {
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
            const createResponse = await fetch(`${DAISYS_API_BASE}/v1/speak/voices/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Default Infilling Voice',
                    gender: 'neutral',
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
            // Format the text with prosody controls based on durations
            const formattedText = this.formatTextWithProsody(text, phonemeDurations);
            
            const response = await fetch(`${DAISYS_API_BASE}/v1/speak/takes/generate`, {
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
            const response = await fetch(`${DAISYS_API_BASE}/auth/refresh`, {
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