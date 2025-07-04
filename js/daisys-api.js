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
        this.voiceId = sessionStorage.getItem('daisys_voice_id');
        
        // Voice creation state
        this.isCreatingVoice = false;
        
        // Auto-refresh timer
        this.refreshTimer = null;
        this.startRefreshTimer();
    }
    
    // Start auto-refresh timer
    startRefreshTimer() {
        // Clear existing timer if any
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Set up refresh every 50 minutes (50 * 60 * 1000 ms)
        this.refreshTimer = setInterval(() => {
            if (this.isLoggedIn() && this.refreshToken) {
                console.log('Auto-refreshing token...');
                this.refreshAccessToken().catch(error => {
                    console.error('Auto-refresh failed:', error);
                    // If refresh fails, prompt for login
                    this.logout();
                    // Dispatch event to show error in UI
                    window.dispatchEvent(new CustomEvent('daisys-error', {
                        detail: { message: 'Your session has expired. Please login again.' }
                    }));
                });
            }
        }, 50 * 60 * 1000);
    }
    
    // Stop auto-refresh timer
    stopRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    // Load tokens from sessionStorage
    loadTokens() {
        const accessToken = sessionStorage.getItem('daisys_access_token');
        const refreshToken = sessionStorage.getItem('daisys_refresh_token');
        const username = sessionStorage.getItem('daisys_username');
        const voiceId = sessionStorage.getItem('daisys_voice_id');
        
        // Ensure we don't store "undefined" as a string
        this.accessToken = (accessToken && accessToken !== 'undefined') ? accessToken : null;
        this.refreshToken = (refreshToken && refreshToken !== 'undefined') ? refreshToken : null;
        this.username = (username && username !== 'undefined') ? username : null;
        this.voiceId = (voiceId && voiceId !== 'undefined') ? voiceId : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        const isValid = this.accessToken && this.accessToken !== 'undefined' && this.accessToken !== 'null';
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
                sessionStorage.setItem('daisys_access_token', window.config.MOCK_TOKEN);
                sessionStorage.setItem('daisys_username', email);
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
            console.log('Login successful, received data:', Object.keys(data));
            
            // Store tokens - check different possible response formats
            const accessToken = data.access || data.access_token || data.accessToken;
            const refreshToken = data.refresh || data.refresh_token || data.refreshToken;
            
            if (accessToken) {
                this.accessToken = accessToken;
                sessionStorage.setItem('daisys_access_token', accessToken);
            } else {
                console.error('No access token found in response!');
            }
            
            if (refreshToken) {
                this.refreshToken = refreshToken;
                sessionStorage.setItem('daisys_refresh_token', refreshToken);
            }
            
            this.username = email;
            sessionStorage.setItem('daisys_username', email);
            
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
        
        sessionStorage.removeItem('daisys_access_token');
        sessionStorage.removeItem('daisys_refresh_token');
        sessionStorage.removeItem('daisys_username');
        sessionStorage.removeItem('daisys_voice_id');
        
        // Stop the refresh timer
        this.stopRefreshTimer();
    }
    
    // Clear invalid tokens
    clearInvalidTokens() {
        const items = ['daisys_access_token', 'daisys_refresh_token'];
        items.forEach(key => {
            const value = sessionStorage.getItem(key);
            if (value === 'undefined' || value === 'null' || !value) {
                sessionStorage.removeItem(key);
            }
        });
        this.loadTokens();
    }

    // Get or create a voice for infilling-en-v1 model
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
            
            // Look for an infilling-en-v1 voice
            const infillingVoice = voices.find(v => v.model === 'infilling-en-v1');
            console.log('Found infilling voice:', infillingVoice);

            if (infillingVoice) {
                this.isCreatingVoice = false;
                const voiceId = infillingVoice.id || infillingVoice.voice_id;
                console.log('Returning existing voice ID:', voiceId);
                return voiceId;
            }

            // Create a new voice
            const createResponse = await fetch(`${this.apiUrl}/v1/speak/voices/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Default Infilling Voice',
                    gender: 'male',
                    model: 'infilling-en-v1'
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
    async generateTTS(text, voiceId, editedDurations, originalTakeId = null, prosody = null) {
        try {
            // If using mock mode, return mock data
            if (this.mockMode) {
                console.log('Mock mode: Using mock TTS generation');
                return {
                    takeId: 'mock_take_' + Date.now(),
                    audioUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=', // Silent audio
                    duration: 2.5,
                    normalizedText: text,
                    phonemeDurations: [[[["h", 2], ["ə", 4], ["l", 8], ["oʊ", 27]]]]
                };
            }
            
            console.log('Using voice ID:', voiceId);
            
            // Ensure we have a valid token
            if (!this.accessToken || this.accessToken === 'undefined') {
                throw new Error('No valid access token available');
            }
            
            // Ensure we have a voice ID
            if (!voiceId) {
                throw new Error('No voice ID provided for TTS generation');
            }
            
            let endpoint, requestBody;
            
            if (originalTakeId && editedDurations) {
                // Use regenerate endpoint for subsequent generations
                endpoint = '/v1/speak/takes/regenerate';
                
                // Calculate edited text and phoneme durations
                const editData = this.calculateEditedData(text, editedDurations, this.originalPhonemeDurations);
                
                requestBody = {
                    voice_id: voiceId,
                    text: text,
                    edit_take_id: originalTakeId,
                    text_to_edit: editData.textToEdit,
                    phoneme_durations: editData.phonemeDurations
                };
                
                // Add prosody if provided (all fields required for regenerate)
                if (prosody) {
                    requestBody.prosody = {
                        pitch: prosody.pitch,
                        pace: prosody.pace,
                        expression: prosody.expression
                    };
                }
            } else {
                // Use generate endpoint for first generation
                endpoint = '/v1/speak/takes/generate';
                
                requestBody = {
                    voice_id: voiceId,
                    text: text
                };
                
                // Add prosody if provided (all values for initial generation)
                if (prosody) {
                    requestBody.prosody = prosody;
                }
            }
            
            
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
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
            
            // Extract take ID from response
            const takeId = data.take_id || data.takeId || data.id;
            
            if (!takeId) {
                console.error('No take ID in response:', data);
                throw new Error('No take ID returned from TTS API');
            }
            
            console.log('Take created with ID:', takeId);
            
            // Poll for take status
            const readyData = await this.waitForTakeReady(takeId);
            
            // Construct audio URL
            const audioUrl = `${this.apiUrl}/v1/speak/takes/${takeId}/wav`;
            console.log('Audio URL:', audioUrl);
            
            // Extract phoneme durations from the ready response
            const phonemeDurations = readyData.info?.phoneme_durations || readyData.phoneme_durations || null;
            console.log('Phoneme durations from API:', phonemeDurations);
            
            return {
                takeId: takeId,
                audioUrl: audioUrl,
                duration: readyData.info?.duration || data.duration || 0,
                normalizedText: readyData.info?.normalized_text || data.normalized_text || text,
                phonemeDurations: phonemeDurations
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
    
    // Calculate edited data for regenerate endpoint
    calculateEditedData(text, allDurations, originalDurations) {
        const words = text.split(' ');
        const sentenceDurations = [];
        const editedSpans = [];
        let currentSpan = [];
        let inEditedSpan = false;
        
        // Convert all durations to API format and find edited spans
        words.forEach((word, index) => {
            const wordPhonemes = [];
            let isEdited = false;
            
            if (allDurations[word]) {
                // Check if this word has been edited using index-based structure
                if (window.wordPhonemeOrder && window.wordPhonemeOrder[word]) {
                    const orderedPhonemes = window.wordPhonemeOrder[word];
                    
                    // Compare current durations with original
                    for (let i = 0; i < orderedPhonemes.length; i++) {
                        const [phoneme, origDuration] = orderedPhonemes[i];
                        const currentDuration = allDurations[word][i];
                        if (currentDuration && Math.abs(currentDuration - origDuration) > 1) {
                            isEdited = true;
                            break;
                        }
                    }
                    
                    // Add phonemes in the original order
                    orderedPhonemes.forEach(([phoneme, _], idx) => {
                        const duration = allDurations[word][idx];
                        if (duration !== undefined) {
                            wordPhonemes.push([phoneme, Math.round(duration)]);
                        }
                    });
                }
                
                // Add SIL token if this word has one
                if (window.silenceData && window.silenceData[word]) {
                    wordPhonemes.push(['SIL', Math.round(window.silenceData[word])]);
                }
                
                if (wordPhonemes.length > 0) {
                    sentenceDurations.push(wordPhonemes);
                }
            }
            
            // Track edited words
            if (isEdited) {
                editedSpans.push(index);
            }
        });
        
        // Create continuous spans from edited indices
        let textToEdit = [];
        if (editedSpans.length > 0) {
            // Find the minimum and maximum indices of edited words
            const minIndex = Math.min(...editedSpans);
            const maxIndex = Math.max(...editedSpans);
            
            // Create a span from first edited word to last edited word
            const spanWords = [];
            for (let i = minIndex; i <= maxIndex; i++) {
                spanWords.push(words[i]);
            }
            
            textToEdit = [spanWords.join(' ')];
        } else {
            // If nothing edited, use full text
            textToEdit = [text];
        }
        
        return {
            textToEdit: textToEdit,
            phonemeDurations: [sentenceDurations]
        };
    }
    
    // Wait for take to be ready
    async waitForTakeReady(takeId, maxAttempts = 30) {
        console.log('Polling for take status:', takeId);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(`${this.apiUrl}/v1/speak/takes/${takeId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to get take status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log(`Take status (attempt ${attempt + 1}):`, data.status);
                
                if (data.status === 'ready') {
                    console.log('Take is ready!');
                    return data;
                }
                
                if (data.status === 'failed' || data.status === 'error') {
                    throw new Error(`Take generation failed with status: ${data.status}`);
                }
                
                // Wait before next poll (start with 200ms, increase gradually)
                const delay = Math.min(200 + (attempt * 100), 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (error) {
                console.error('Error polling take status:', error);
                throw error;
            }
        }
        
        throw new Error('Take generation timed out');
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
            sessionStorage.setItem('daisys_access_token', data.access);
            
            return true;
        } catch (error) {
            console.error('Refresh error:', error);
            return false;
        }
    }
}

// Export for use in main app
window.DaisysAPI = DaisysAPI;
