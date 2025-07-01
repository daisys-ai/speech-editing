// DOM Elements
const textInput = document.getElementById('text-input');
const wordDisplay = document.getElementById('word-display');
const selectedWordElem = document.getElementById('selected-word');
const phonemesContainer = document.getElementById('phonemes-container');
const togglePhonemesBtn = document.getElementById('toggle-phonemes');
const speedSlider = document.getElementById('speed-slider');
const playBtn = document.getElementById('play-btn');
const simpleMode = document.getElementById('simple-mode');
const advancedMode = document.getElementById('advanced-mode');
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const cancelLoginBtn = document.getElementById('cancel-login');
const authContainer = document.getElementById('auth-container');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

// Initialize Daisys API
const daisysAPI = new DaisysAPI();

// Mock data for phonemes (in a real app, this would come from an API)
const phonemeData = {
    'quick': ['k', 'w', 'ɪ', 'k'],
    'brown': ['b', 'r', 'aʊ', 'n'],
    'fox': ['f', 'ɒ', 'k', 's'],
    'jumps': ['dʒ', 'ʌ', 'm', 'p', 's'],
    'over': ['oʊ', 'v', 'ə', 'r'],
    'the': ['ð', 'ə'],
    'lazy': ['l', 'eɪ', 'z', 'i'],
    'dog': ['d', 'ɔ', 'g'],
    'The': ['ð', 'ə']
};

// Basic English phoneme sets to generate mock data
const vowels = ['æ', 'ɑ', 'ʌ', 'ə', 'ɪ', 'i', 'ɛ', 'e', 'ʊ', 'u', 'ɔ', 'o', 'aɪ', 'aʊ', 'ɔɪ', 'eɪ', 'oʊ'];
const consonants = ['b', 'p', 'd', 't', 'g', 'k', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'tʃ', 'dʒ', 'm', 'n', 'ŋ', 'l', 'r', 'w', 'j'];

// Function to generate mock phoneme data for words
function generatePhonemeData(word) {
    if (word === '<break/>') {
        return [];
    }
    
    if (phonemeData[word]) {
        return phonemeData[word];
    }
    
    // Simple algorithm to generate plausible phonemes
    const result = [];
    const letters = word.toLowerCase().split('');
    
    let i = 0;
    while (i < letters.length) {
        // Check for common digraphs
        if (i < letters.length - 1) {
            const digraph = letters[i] + letters[i + 1];
            
            // Handle common digraphs
            if (digraph === 'th') {
                result.push('θ');
                i += 2;
                continue;
            } else if (digraph === 'sh') {
                result.push('ʃ');
                i += 2;
                continue;
            } else if (digraph === 'ch') {
                result.push('tʃ');
                i += 2;
                continue;
            } else if (digraph === 'ph') {
                result.push('f');
                i += 2;
                continue;
            }
        }
        
        // Handle single letters
        const letter = letters[i];
        
        // Simple vowel mapping
        if ('aeiou'.includes(letter)) {
            // Select a vowel phoneme (simplified)
            result.push(vowels[Math.floor(Math.random() * 5)]);
        } else {
            // Try to map consonants more accurately
            if (letter === 'b') result.push('b');
            else if (letter === 'c') result.push('k');
            else if (letter === 'd') result.push('d');
            else if (letter === 'f') result.push('f');
            else if (letter === 'g') result.push('g');
            else if (letter === 'h') result.push('h');
            else if (letter === 'j') result.push('dʒ');
            else if (letter === 'k') result.push('k');
            else if (letter === 'l') result.push('l');
            else if (letter === 'm') result.push('m');
            else if (letter === 'n') result.push('n');
            else if (letter === 'p') result.push('p');
            else if (letter === 'q') result.push('k');
            else if (letter === 'r') result.push('r');
            else if (letter === 's') result.push('s');
            else if (letter === 't') result.push('t');
            else if (letter === 'v') result.push('v');
            else if (letter === 'w') result.push('w');
            else if (letter === 'x') result.push('ks');
            else if (letter === 'y') result.push('j');
            else if (letter === 'z') result.push('z');
        }
        
        i++;
    }
    
    // Ensure we have at least one phoneme
    if (result.length === 0) {
        result.push(vowels[0]);
    }
    
    // Cache the result for future use
    phonemeData[word] = result;
    
    return result;
}

// Current state
let currentMode = 'simple';
let selectedWord = 'quick';
let wordDurations = {};
let phonemeDurations = {};
let isDragging = false;
let dragTarget = null;
let dragStartX = 0;
let originalWidth = 0;

// Callback for duration changes
let onDurationChangeCallback = null;

// Set the duration change callback
function setDurationChangeCallback(callback) {
    onDurationChangeCallback = callback;
}

// Helper function to get all phoneme durations
function getAllPhonemeDurations() {
    const result = [];
    const words = textInput.value.split(' ').filter(word => word.trim() !== '');
    
    words.forEach(word => {
        if (word === '<break/>') {
            // Handle silence blocks
            const duration = wordDurations[word] || 1.0;
            result.push(['<silence>', Math.round(duration * 100)]);
        } else {
            const phonemes = generatePhonemeData(word);
            phonemes.forEach(phoneme => {
                const duration = (phonemeDurations[word] && phonemeDurations[word][phoneme]) || 1.0;
                const wordDuration = wordDurations[word] || 1.0;
                // Calculate actual duration as product of word and phoneme durations
                const actualDuration = duration * wordDuration;
                result.push([phoneme, Math.round(actualDuration * 100)]);
            });
        }
    });
    
    return result;
}

// Trigger the duration change callback
function triggerDurationChange() {
    if (onDurationChangeCallback) {
        const durations = getAllPhonemeDurations();
        console.log('Phoneme durations:', durations);
        onDurationChangeCallback(durations);
    }
}

// Add initial help message
function addInitialHelp() {
    // Only show the help message once
    if (localStorage.getItem('wordDurationHelpShown')) {
        return;
    }
    
    const helpMessage = document.createElement('div');
    helpMessage.className = 'help-message';
    helpMessage.innerHTML = `
        <p><strong>Tip:</strong> Drag the blue handles on the sides of words to adjust their duration.</p>
        <button class="close-help">Got it</button>
    `;
    
    document.querySelector('.container').appendChild(helpMessage);
    
    // Add event listener to close button
    document.querySelector('.close-help').addEventListener('click', () => {
        helpMessage.style.display = 'none';
        localStorage.setItem('wordDurationHelpShown', 'true');
    });
}

// Initialize the app
function init() {
    // Initialize default durations
    const words = textInput.value.split(' ');
    words.forEach(word => {
        wordDurations[word] = 1.0; // Default duration multiplier
        
        // Generate phoneme data if needed
        const wordPhonemes = generatePhonemeData(word);
        
        phonemeDurations[word] = {};
        wordPhonemes.forEach(phoneme => {
            phonemeDurations[word][phoneme] = 1.0; // Default phoneme duration
        });
    });
    
    renderWords();
    updatePhonemes(selectedWord);
    addEventListeners();
    addInitialHelp();
}

// Calculate appropriate base width for a word based on its length
function getBaseWidthForWord(word) {
    // Base width calculation - min 80px, max 200px
    // Adjust these values to your preference
    const minWidth = 80;
    const maxWidth = 200;
    
    // Use a formula to determine width based on word length
    const calculatedWidth = Math.min(maxWidth, Math.max(minWidth, minWidth + (word.length - 4) * 10));
    
    return calculatedWidth;
}

// Render the words in the word display
function renderWords() {
    const words = textInput.value.split(' ');
    wordDisplay.innerHTML = '';
    
    words.forEach((word, index) => {
        // Add insert silence button before each word (except the first)
        if (index > 0) {
            const insertBtn = document.createElement('button');
            insertBtn.className = 'insert-silence';
            insertBtn.innerHTML = '+';
            insertBtn.title = 'Insert silence';
            insertBtn.dataset.position = index;
            wordDisplay.appendChild(insertBtn);
        }
        // Check if word duration has been modified from default
        const isModified = wordDurations[word] && Math.abs(wordDurations[word] - 1.0) > 0.05;
        const isSelected = word === selectedWord;
        
        const wordBox = document.createElement('div');
        const isSilence = word === '<break/>';
        wordBox.className = `word-box ${isSelected ? 'selected' : ''} ${isSilence ? 'silence' : ''}`;
        wordBox.dataset.word = word;
        wordBox.innerHTML = `
            <div class="word-content">
                <div>${isSilence ? 'silence' : word}</div>
                ${isModified ? `<button class="reset-word" title="Reset to default duration">↺</button>` : ''}
            </div>
            <div class="waveform">
                <svg width="100%" height="20" viewBox="0 0 100 20">
                    <path d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10" 
                          fill="none" 
                          stroke="${isSelected ? '#4285f4' : '#ddd'}" 
                          stroke-width="2"/>
                </svg>
            </div>
            <div class="handle handle-left" data-handle="left" title="Drag to adjust duration"></div>
            <div class="handle handle-right" data-handle="right" title="Drag to adjust duration"></div>
        `;
        
        // Get base width for this word
        const baseWidth = getBaseWidthForWord(word);
        
        // Set width based on duration
        if (wordDurations[word]) {
            wordBox.style.width = `${baseWidth * wordDurations[word]}px`;
        } else {
            // If no duration set yet, use default
            wordBox.style.width = `${baseWidth}px`;
        }
        
        // Store the base width as a data attribute for later use
        wordBox.dataset.baseWidth = baseWidth;
        
        wordDisplay.appendChild(wordBox);
    });
}

// Update phonemes display for the selected word
function updatePhonemes(word) {
    selectedWordElem.textContent = `"${word === '<break/>' ? 'silence' : word}"`;
    
    // For silence blocks, don't show phonemes
    if (word === '<break/>') {
        phonemesContainer.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">Silence has no phonemes</div>';
        return;
    }
    
    // Generate phoneme data if it doesn't exist
    const wordPhonemes = generatePhonemeData(word);
    
    phonemesContainer.innerHTML = '';
    
    wordPhonemes.forEach((phoneme, index) => {
        const phonemeBox = document.createElement('div');
        phonemeBox.className = 'phoneme-box';
        phonemeBox.dataset.phoneme = phoneme;
        phonemeBox.dataset.index = index;
        
        // Check if this phoneme has been modified from default
        const isModified = phonemeDurations[word] && 
                          phonemeDurations[word][phoneme] && 
                          Math.abs(phonemeDurations[word][phoneme] - 1.0) > 0.05;
        
        phonemeBox.innerHTML = `
            <div class="phoneme-content">
                <div class="phoneme-text">${phoneme}</div>
                ${isModified ? `<button class="reset-phoneme" title="Reset to default duration">↺</button>` : ''}
            </div>
            <div class="handle handle-left" data-handle="left" title="Drag to adjust duration"></div>
            <div class="handle handle-right" data-handle="right" title="Drag to adjust duration"></div>
        `;
        
        // Set width based on phoneme duration
        if (phonemeDurations[word] && phonemeDurations[word][phoneme]) {
            const baseWidth = 40; // Base width in pixels
            phonemeBox.style.width = `${baseWidth * phonemeDurations[word][phoneme]}px`;
        }
        
        phonemesContainer.appendChild(phonemeBox);
    });
}

// Helper function to update word duration based on phoneme durations
function updateWordDurationFromPhonemes(word) {
    if (!phonemeDurations[word]) return;
    
    const phonemes = Object.keys(phonemeDurations[word]);
    if (phonemes.length === 0) return;
    
    // Calculate average of phoneme durations
    const totalDuration = phonemes.reduce((sum, phoneme) => {
        return sum + phonemeDurations[word][phoneme];
    }, 0);
    
    const averageDuration = totalDuration / phonemes.length;
    
    // Update word duration
    wordDurations[word] = averageDuration;
    
    // Update word box width
    const wordBox = document.querySelector(`.word-box[data-word="${word}"]`);
    if (wordBox) {
        const baseWidth = 80;
        wordBox.style.width = `${baseWidth * wordDurations[word]}px`;
    }
    
    // Update slider value
    if (word === selectedWord) {
        const sliderValue = (2 - wordDurations[word]) * 50;
        speedSlider.value = sliderValue;
    }
}

// Add event listeners
function addEventListeners() {
    // Mode toggle
    simpleMode.addEventListener('click', () => switchMode('simple'));
    advancedMode.addEventListener('click', () => switchMode('advanced'));
    
    // Toggle phonemes visibility
    togglePhonemesBtn.addEventListener('click', () => {
        const isVisible = phonemesContainer.style.display === 'flex';
        
        if (isVisible) {
            // Hide phonemes
            phonemesContainer.style.display = 'none';
            togglePhonemesBtn.querySelector('span:first-child').textContent = 'Show phonemes';
            togglePhonemesBtn.classList.remove('active');
        } else {
            // Show phonemes
            phonemesContainer.style.display = 'flex';
            togglePhonemesBtn.querySelector('span:first-child').textContent = 'Hide phonemes';
            togglePhonemesBtn.classList.add('active');
        }
    });
    
    // Word selection and silence insertion
    wordDisplay.addEventListener('click', e => {
        // Handle silence insertion
        if (e.target.classList.contains('insert-silence')) {
            const position = parseInt(e.target.dataset.position);
            const words = textInput.value.split(' ');
            words.splice(position, 0, '<break/>');
            textInput.value = words.join(' ');
            
            // Initialize duration for the new silence block
            wordDurations['<break/>'] = 1.0;
            
            renderWords();
            triggerDurationChange();
            return;
        }
        
        const wordBox = e.target.closest('.word-box');
        if (wordBox) {
            // Update the selected word
            selectedWord = wordBox.dataset.word;
            
            // Update selected class on all word boxes
            document.querySelectorAll('.word-box').forEach(box => {
                box.classList.remove('selected');
                
                // Update the waveform stroke color for all words
                const waveformPath = box.querySelector('.waveform svg path');
                if (waveformPath) {
                    waveformPath.setAttribute('stroke', '#ddd');
                }
            });
            
            // Add selected class to the clicked word box
            wordBox.classList.add('selected');
            
            // Update the waveform stroke color for selected word
            const selectedWaveform = wordBox.querySelector('.waveform svg path');
            if (selectedWaveform) {
                selectedWaveform.setAttribute('stroke', '#4285f4');
            }
            
            // Update phonemes display
            updatePhonemes(selectedWord);
            
            // Update speed slider to match the selected word's duration
            if (wordDurations[selectedWord]) {
                const sliderValue = (2 - wordDurations[selectedWord]) * 50;
                speedSlider.value = sliderValue;
            }
        }
    });
    
    // Drag handling for word boxes
    document.addEventListener('mousedown', e => {
        if (e.target.classList.contains('handle')) {
            isDragging = true;
            dragTarget = e.target.closest('.word-box') || e.target.closest('.phoneme-box');
            dragStartX = e.clientX;
            originalWidth = dragTarget.offsetWidth;
            
            // Which handle
            const handleType = e.target.dataset.handle;
            dragTarget.dataset.dragHandle = handleType;
            
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', e => {
        if (!isDragging || !dragTarget) return;
        
        const deltaX = e.clientX - dragStartX;
        const handleType = dragTarget.dataset.dragHandle;
        
        if (handleType === 'right') {
            const newWidth = Math.max(40, originalWidth + deltaX);
            dragTarget.style.width = `${newWidth}px`;
        } else if (handleType === 'left') {
            const newWidth = Math.max(40, originalWidth - deltaX);
            dragTarget.style.width = `${newWidth}px`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging && dragTarget) {
            // Update durations based on the new width
            if (dragTarget.classList.contains('word-box')) {
                const word = dragTarget.dataset.word;
                // Get the stored base width for this word
                const baseWidth = parseInt(dragTarget.dataset.baseWidth) || 80;
                const newDuration = dragTarget.offsetWidth / baseWidth;
                wordDurations[word] = newDuration;
                
                // Check if we need to add a reset button if not already present
                const isChanged = Math.abs(newDuration - 1.0) > 0.05;
                const resetButton = dragTarget.querySelector('.reset-word');
                
                if (isChanged && !resetButton) {
                    const wordContent = dragTarget.querySelector('.word-content');
                    const resetBtn = document.createElement('button');
                    resetBtn.className = 'reset-word';
                    resetBtn.title = 'Reset to default duration';
                    resetBtn.textContent = '↺';
                    
                    wordContent.appendChild(resetBtn);
                } else if (!isChanged && resetButton) {
                    // Remove the reset button if duration is close to default
                    resetButton.remove();
                }
                
                // Update slider if this is the selected word
                if (word === selectedWord) {
                    const sliderValue = (2 - wordDurations[word]) * 50;
                    speedSlider.value = sliderValue;
                }
                
                // Trigger duration change callback
                triggerDurationChange();
            } else if (dragTarget.classList.contains('phoneme-box')) {
                const phoneme = dragTarget.dataset.phoneme;
                const baseWidth = 40; // Base width in pixels
                
                if (!phonemeDurations[selectedWord]) {
                    phonemeDurations[selectedWord] = {};
                }
                
                const oldDuration = phonemeDurations[selectedWord][phoneme] || 1.0;
                const newDuration = dragTarget.offsetWidth / baseWidth;
                phonemeDurations[selectedWord][phoneme] = newDuration;
                
                // Check if we need to add a reset button if not already present
                const isChanged = Math.abs(newDuration - 1.0) > 0.05;
                const resetButton = dragTarget.querySelector('.reset-phoneme');
                
                if (isChanged && !resetButton) {
                    const phonemeContent = dragTarget.querySelector('.phoneme-content');
                    const resetBtn = document.createElement('button');
                    resetBtn.className = 'reset-phoneme';
                    resetBtn.title = 'Reset to default duration';
                    resetBtn.textContent = '↺';
                    
                    phonemeContent.appendChild(resetBtn);
                } else if (!isChanged && resetButton) {
                    // Remove the reset button if duration is close to default
                    resetButton.remove();
                }
                
                // Update overall word duration
                updateWordDurationFromPhonemes(selectedWord);
                
                // Trigger duration change callback
                triggerDurationChange();
            }
        }
        
        // Reset drag state
        isDragging = false;
        dragTarget = null;
        document.body.style.cursor = '';
    });
    
    // Global event delegation for reset buttons (phonemes and words)
    document.addEventListener('click', (e) => {
        // Handle phoneme reset buttons
        if (e.target.classList.contains('reset-phoneme') || e.target.closest('.reset-phoneme')) {
            e.stopPropagation(); // Prevent selecting the word
            
            const resetButton = e.target.classList.contains('reset-phoneme') ? 
                e.target : e.target.closest('.reset-phoneme');
            const phonemeBox = resetButton.closest('.phoneme-box');
            const phoneme = phonemeBox.dataset.phoneme;
            
            console.log('Reset clicked for phoneme:', phoneme);
            
            // Reset the phoneme duration to default
            phonemeDurations[selectedWord][phoneme] = 1.0;
            
            // Update the UI
            const baseWidth = 40;
            phonemeBox.style.width = `${baseWidth}px`;
            
            // Remove the reset button
            resetButton.remove();
            
            // Update the word width based on average of phoneme durations
            updateWordDurationFromPhonemes(selectedWord);
            
            // Trigger duration change callback
            triggerDurationChange();
        }
        
        // Handle word reset buttons
        if (e.target.classList.contains('reset-word') || e.target.closest('.reset-word')) {
            e.stopPropagation(); // Prevent normal word selection
            
            const resetButton = e.target.classList.contains('reset-word') ? 
                e.target : e.target.closest('.reset-word');
            const wordBox = resetButton.closest('.word-box');
            const word = wordBox.dataset.word;
            
            console.log('Reset clicked for word:', word);
            
            // Reset the word duration to default
            wordDurations[word] = 1.0;
            
            // If in advanced mode, also reset all phonemes for this word
            if (currentMode === 'advanced' && phonemeDurations[word]) {
                Object.keys(phonemeDurations[word]).forEach(phoneme => {
                    phonemeDurations[word][phoneme] = 1.0;
                });
                
                // If this is the selected word, update the phoneme display
                if (word === selectedWord) {
                    updatePhonemes(word);
                }
            }
            
            // Get the stored base width for this word
            const baseWidth = parseInt(wordBox.dataset.baseWidth) || 80;
            
            // Update the UI
            wordBox.style.width = `${baseWidth}px`;
            
            // Update the slider if this is the selected word
            if (word === selectedWord) {
                speedSlider.value = 50; // 50 is the middle/default
            }
            
            // Remove the reset button
            resetButton.remove();
            
            // Trigger duration change callback
            triggerDurationChange();
        }
    });
    
    // Speed slider
    speedSlider.addEventListener('input', e => {
        const speed = e.target.value / 50; // 0-2 range (1 is default)
        
        if (currentMode === 'simple') {
            const oldDuration = wordDurations[selectedWord] || 1.0;
            const newDuration = 2 - speed; // Invert so higher slider = faster
            wordDurations[selectedWord] = newDuration;
            
            const wordBox = document.querySelector(`.word-box[data-word="${selectedWord}"]`);
            if (wordBox) {
                // Get the stored base width for this word
                const baseWidth = parseInt(wordBox.dataset.baseWidth) || 80;
                wordBox.style.width = `${baseWidth * wordDurations[selectedWord]}px`;
                
                // Check if we need to add/remove reset button based on duration change
                const isChanged = Math.abs(newDuration - 1.0) > 0.05;
                const resetButton = wordBox.querySelector('.reset-word');
                
                if (isChanged && !resetButton) {
                    const wordContent = wordBox.querySelector('.word-content');
                    const resetBtn = document.createElement('button');
                    resetBtn.className = 'reset-word';
                    resetBtn.title = 'Reset to default duration';
                    resetBtn.textContent = '↺';
                    
                    wordContent.appendChild(resetBtn);
                } else if (!isChanged && resetButton) {
                    // Remove the reset button if duration is close to default
                    resetButton.remove();
                }
                
                // Trigger duration change callback
                triggerDurationChange();
            }
        } else {
            // In advanced mode, adjust all phonemes proportionally
            if (phonemeDurations[selectedWord]) {
                Object.keys(phonemeDurations[selectedWord]).forEach(phoneme => {
                    phonemeDurations[selectedWord][phoneme] = 2 - speed;
                });
                
                // Update phoneme box widths
                document.querySelectorAll('.phoneme-box').forEach(box => {
                    const phoneme = box.dataset.phoneme;
                    box.style.width = `${40 * phonemeDurations[selectedWord][phoneme]}px`;
                });
                
                // Update word duration and width
                wordDurations[selectedWord] = 2 - speed;
                
                const wordBox = document.querySelector(`.word-box[data-word="${selectedWord}"]`);
                if (wordBox) {
                    // Get the stored base width for this word
                    const baseWidth = parseInt(wordBox.dataset.baseWidth) || 80;
                    wordBox.style.width = `${baseWidth * wordDurations[selectedWord]}px`;
                }
                
                // Trigger duration change callback
                triggerDurationChange();
            }
        }
    });
    
    // Text input change
    textInput.addEventListener('input', () => {
        const words = textInput.value.split(' ').filter(word => word.trim() !== '');
        
        // Generate durations for new words
        words.forEach(word => {
            if (!wordDurations[word]) {
                wordDurations[word] = 1.0;
                
                // Generate and store phoneme data
                const wordPhonemes = generatePhonemeData(word);
                phonemeDurations[word] = {};
                
                wordPhonemes.forEach(phoneme => {
                    phonemeDurations[word][phoneme] = 1.0;
                });
            }
        });
        
        renderWords();
        
        // Update selected word if it no longer exists in the text
        const wordExists = words.includes(selectedWord);
        if (!wordExists && words.length > 0) {
            selectedWord = words[0];
            updatePhonemes(selectedWord);
            
            // Update slider value based on the new selected word
            if (wordDurations[selectedWord]) {
                const sliderValue = (2 - wordDurations[selectedWord]) * 50;
                speedSlider.value = sliderValue;
            }
        }
    });
    
    // Simulate play button
    playBtn.addEventListener('click', () => {
        // In a real app, this would trigger audio playback
        playBtn.classList.add('playing');
        setTimeout(() => {
            playBtn.classList.remove('playing');
        }, 2000);
    });
}

// Switch between simple and advanced modes
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'simple') {
        simpleMode.classList.add('active');
        advancedMode.classList.remove('active');
        document.body.classList.remove('advanced-mode');
        phonemesContainer.style.display = 'none';
        
        // Reset the toggle button
        togglePhonemesBtn.querySelector('span:first-child').textContent = 'Show phonemes';
        togglePhonemesBtn.classList.remove('active');
    } else {
        simpleMode.classList.remove('active');
        advancedMode.classList.add('active');
        document.body.classList.add('advanced-mode');
        phonemesContainer.style.display = 'flex';
        
        // Update the toggle button
        togglePhonemesBtn.querySelector('span:first-child').textContent = 'Hide phonemes';
        togglePhonemesBtn.classList.add('active');
    }
}

// Create voice with UI feedback
async function createVoiceWithUI() {
    try {
        // Update UI to show voice creation is in progress
        updateUIState();
        
        console.log('Creating voice...');
        const voiceId = await daisysAPI.getOrCreateVoice();
        
        // Store the voice ID if valid
        if (voiceId && voiceId !== 'undefined') {
            daisysAPI.voiceId = voiceId;
            localStorage.setItem('daisys_voice_id', voiceId);
            console.log('Voice created/retrieved:', voiceId);
        } else {
            console.error('Invalid voice ID returned:', voiceId);
            throw new Error('Invalid voice ID returned from API');
        }
        
        // Update UI to show voice is ready
        updateUIState();
    } catch (error) {
        console.error('Failed to create voice:', error);
        alert('Failed to create voice. You may need to try logging in again.');
        
        // Update UI to show error state
        updateUIState();
    }
}

// Add authentication event listeners
function addAuthEventListeners() {
    // Login button click
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
    
    // Cancel login
    cancelLoginBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
        loginForm.reset();
    });
    
    // Close modal on background click
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
            loginForm.reset();
        }
    });
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Disable form during login
        loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
        
        const result = await daisysAPI.login(username, password);
        
        if (result.success) {
            loginModal.classList.remove('active');
            loginForm.reset();
            
            // Reload tokens to ensure they're properly set
            daisysAPI.loadTokens();
            
            updateAuthUI();
            updateUIState();
            
            // Create voice if needed
            if (result.needsVoice && !daisysAPI.voiceId) {
                console.log('Need to create voice...');
                createVoiceWithUI();
            } else {
                console.log('Voice already exists:', daisysAPI.voiceId);
            }
        } else {
            // Show more detailed error message
            const errorMsg = result.error || 'Login failed. Please check your credentials.';
            alert(`Login failed: ${errorMsg}\n\nTip: You can enable mock mode by adding ?mock=true to the URL or setting MOCK_MODE=true in your .env file.`);
        }
        
        // Re-enable form
        loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        daisysAPI.logout();
        updateAuthUI();
        updateUIState();
    });
}

// Update authentication UI
function updateAuthUI() {
    console.log('Updating auth UI, logged in:', daisysAPI.isLoggedIn());
    console.log('Access token:', daisysAPI.accessToken);
    console.log('Username:', daisysAPI.username);
    
    if (daisysAPI.isLoggedIn()) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = daisysAPI.username;
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// State management
let hasGeneratedPreview = false;
let currentAudio = null;
let previewHistory = [];
let currentSessionId = Date.now().toString();

// Update UI state based on login and preview status
function updateUIState() {
    const isLoggedIn = daisysAPI.isLoggedIn();
    const isCreatingVoice = daisysAPI.isCreatingVoice;
    const hasVoice = !!daisysAPI.voiceId;
    console.log('Updating UI state, logged in:', isLoggedIn, 'has voice:', hasVoice, 'creating voice:', isCreatingVoice, 'has preview:', hasGeneratedPreview);
    
    // Show/hide preview button based on login status
    const previewSection = document.querySelector('.preview-section');
    if (previewSection) {
        console.log('Preview section found, setting display to:', isLoggedIn ? 'block' : 'none');
        previewSection.style.display = isLoggedIn ? 'block' : 'none';
    } else {
        console.error('Preview section not found!');
    }
    
    if (playBtn) {
        console.log('Play button found, setting display to:', isLoggedIn ? 'flex' : 'none');
        playBtn.style.display = isLoggedIn ? 'flex' : 'none';
        
        // Disable button if voice is being created or not ready
        playBtn.disabled = isCreatingVoice || !hasVoice;
        
        // Update button text based on state
        if (isCreatingVoice) {
            playBtn.innerHTML = `
                <div class="spinner"></div>
                <span>Creating voice...</span>
            `;
        } else if (!hasVoice) {
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M8 5v14l11-7z"></path>
                </svg>
                <span>Voice not ready</span>
            `;
        } else {
            playBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M8 5v14l11-7z"></path>
                </svg>
                <span>Preview timing</span>
            `;
        }
    } else {
        console.error('Play button not found!');
    }
    
    // Show/hide word display based on preview status
    wordDisplay.style.display = hasGeneratedPreview ? 'flex' : 'none';
    
    // Show/hide editor based on preview status
    const wordEditor = document.querySelector('.word-editor');
    if (wordEditor) {
        wordEditor.style.display = hasGeneratedPreview ? 'block' : 'none';
    }
    
    // Enable/disable text input based on preview status
    textInput.disabled = hasGeneratedPreview;
    if (hasGeneratedPreview) {
        textInput.style.opacity = '0.6';
        textInput.style.cursor = 'not-allowed';
    } else {
        textInput.style.opacity = '1';
        textInput.style.cursor = 'text';
    }
    
    // Update instruction text
    const instruction = document.querySelector('.instruction');
    if (instruction) {
        if (!isLoggedIn) {
            instruction.innerHTML = '<p>Please login to use the timing editor</p>';
        } else if (isCreatingVoice) {
            instruction.innerHTML = '<p>Creating voice... This may take a few seconds</p>';
        } else if (!hasVoice) {
            instruction.innerHTML = '<p>Voice setup required. Please wait...</p>';
        } else if (!hasGeneratedPreview) {
            instruction.innerHTML = '<p>Click "Preview timing" to generate speech and start editing</p>';
        } else {
            instruction.innerHTML = `
                <p><span class="highlight">Drag the blue handles</span> on word edges to adjust duration or use the slider for precise control</p>
                <p class="subinstruction">Click on any word to select it and adjust its timing</p>
            `;
        }
    }
}

// Modified play button handler
async function handlePlayClick() {
    if (!daisysAPI.isLoggedIn()) return;
    
    playBtn.disabled = true;
    playBtn.innerHTML = `
        <div class="spinner"></div>
        <span>Generating speech...</span>
    `;
    
    try {
        // Check if we have a voice ID
        if (!daisysAPI.voiceId) {
            console.log('No voice ID found, creating one...');
            const voiceId = await daisysAPI.getOrCreateVoice();
            daisysAPI.voiceId = voiceId;
            localStorage.setItem('daisys_voice_id', voiceId);
        }
        
        // Get phoneme durations
        const durations = getAllPhonemeDurations();
        
        // Generate TTS with the stored voice ID
        const result = await daisysAPI.generateTTS(textInput.value, daisysAPI.voiceId, durations);
        
        // Create audio element with authentication
        if (currentAudio) {
            currentAudio.pause();
        }
        
        // For authenticated endpoints, we need to fetch the audio with auth header
        try {
            console.log('Fetching audio from:', result.audioUrl);
            
            // First request with auth header
            const audioResponse = await fetch(result.audioUrl, {
                headers: {
                    'Authorization': `Bearer ${daisysAPI.accessToken}`
                },
                redirect: 'manual' // Don't automatically follow redirects
            });
            
            let finalResponse;
            
            // Check if it's a redirect
            if (audioResponse.type === 'opaqueredirect' || (audioResponse.status >= 300 && audioResponse.status < 400)) {
                // Get the redirect location
                const redirectUrl = audioResponse.headers.get('Location');
                
                if (redirectUrl) {
                    console.log('Following redirect to:', redirectUrl);
                    // Follow redirect WITHOUT auth header (for external URLs like S3/CDN)
                    finalResponse = await fetch(redirectUrl);
                } else {
                    // Fallback: if we can't get the location header, try with automatic redirect
                    console.log('Redirect detected but no Location header, retrying with automatic redirect');
                    finalResponse = await fetch(result.audioUrl, {
                        headers: {
                            'Authorization': `Bearer ${daisysAPI.accessToken}`
                        }
                    });
                }
            } else if (audioResponse.ok) {
                // No redirect, use the original response
                finalResponse = audioResponse;
            } else {
                throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
            }
            
            if (!finalResponse.ok) {
                throw new Error(`Failed to fetch audio from final URL: ${finalResponse.status}`);
            }
            
            const audioBlob = await finalResponse.blob();
            const audioObjectUrl = URL.createObjectURL(audioBlob);
            
            currentAudio = new Audio(audioObjectUrl);
            
            // Play the audio
            await currentAudio.play();
            
            // Clean up the object URL when done
            currentAudio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioObjectUrl);
            });
        } catch (audioError) {
            console.error('Failed to fetch/play audio:', audioError);
            throw audioError;
        }
        
        // Update UI state
        if (!hasGeneratedPreview) {
            hasGeneratedPreview = true;
            updateUIState();
            
            // Initialize word timings (mock data for now)
            initializeWordTimings();
            renderWords();
        }
        
        // Add to history
        addToHistory({
            id: Date.now().toString(),
            sessionId: currentSessionId,
            text: textInput.value,
            audioUrl: result.audioUrl,
            durations: durations,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('TTS generation failed:', error);
        alert('Failed to generate speech. Please try again.');
    } finally {
        playBtn.disabled = false;
        playBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M8 5v14l11-7z"></path>
            </svg>
            <span>Preview timing</span>
        `;
    }
}

// Initialize word timings from TTS response (mock for now)
function initializeWordTimings() {
    const words = textInput.value.split(' ');
    words.forEach(word => {
        if (!wordDurations[word]) {
            // Generate random timings for demo
            wordDurations[word] = 0.8 + Math.random() * 0.4;
            
            const phonemes = generatePhonemeData(word);
            phonemeDurations[word] = {};
            phonemes.forEach(phoneme => {
                phonemeDurations[word][phoneme] = 0.8 + Math.random() * 0.4;
            });
        }
    });
}

// History management
function addToHistory(entry) {
    // Load existing history
    const history = JSON.parse(localStorage.getItem('previewHistory') || '[]');
    history.push(entry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
        history.shift();
    }
    
    localStorage.setItem('previewHistory', JSON.stringify(history));
    previewHistory = history;
    
    updateHistoryUI();
}

// Update history UI
function updateHistoryUI() {
    const historyContent = document.getElementById('history-content');
    const history = JSON.parse(localStorage.getItem('previewHistory') || '[]');
    
    if (history.length === 0) {
        historyContent.innerHTML = '<div class="history-empty">No preview history yet</div>';
        return;
    }
    
    // Group by session
    const sessions = {};
    history.forEach(item => {
        const date = new Date(item.timestamp).toDateString();
        if (!sessions[date]) {
            sessions[date] = [];
        }
        sessions[date].push(item);
    });
    
    // Render sessions
    historyContent.innerHTML = '';
    Object.entries(sessions).reverse().forEach(([date, items]) => {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'history-session';
        sessionDiv.innerHTML = `
            <div class="session-header">
                <div class="session-info">
                    <span class="session-date">${date}</span>
                    <span class="session-count">${items.length} previews</span>
                </div>
                <div class="session-toggle">
                    <svg viewBox="0 0 24 24">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path>
                    </svg>
                </div>
            </div>
            <div class="session-items"></div>
        `;
        
        const itemsContainer = sessionDiv.querySelector('.session-items');
        items.reverse().forEach(item => {
            const time = new Date(item.timestamp).toLocaleTimeString();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            itemDiv.innerHTML = `
                <div class="item-info">
                    <div class="item-text">${item.text}</div>
                    <div class="item-time">${time}</div>
                </div>
                <div class="item-actions">
                    <button class="play-history" title="Play audio" data-id="${item.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    </button>
                    <button class="restore-history" title="Restore durations" data-id="${item.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
                        </svg>
                    </button>
                    <button class="delete-history" title="Delete" data-id="${item.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
        });
        
        historyContent.appendChild(sessionDiv);
    });
}

// Add history widget event listeners
function addHistoryEventListeners() {
    const historyWidget = document.getElementById('history-widget');
    const toggleHistory = document.getElementById('toggle-history');
    const historyHeader = document.querySelector('.history-header');
    
    // Toggle history widget collapse
    historyHeader.addEventListener('click', () => {
        historyWidget.classList.toggle('collapsed');
    });
    
    // Session toggle
    document.addEventListener('click', (e) => {
        if (e.target.closest('.session-header')) {
            const session = e.target.closest('.history-session');
            session.classList.toggle('expanded');
        }
        
        // Play history audio
        if (e.target.closest('.play-history')) {
            const id = e.target.closest('.play-history').dataset.id;
            const history = JSON.parse(localStorage.getItem('previewHistory') || '[]');
            const item = history.find(h => h.id === id);
            
            if (item && item.audioUrl) {
                if (currentAudio) {
                    currentAudio.pause();
                }
                currentAudio = new Audio(item.audioUrl);
                currentAudio.play();
            }
        }
        
        // Restore history durations
        if (e.target.closest('.restore-history')) {
            const id = e.target.closest('.restore-history').dataset.id;
            const history = JSON.parse(localStorage.getItem('previewHistory') || '[]');
            const item = history.find(h => h.id === id);
            
            if (item && item.durations) {
                // Restore the durations
                restoreDurations(item.durations);
                renderWords();
                updatePhonemes(selectedWord);
                triggerDurationChange();
            }
        }
        
        // Delete history item
        if (e.target.closest('.delete-history')) {
            const id = e.target.closest('.delete-history').dataset.id;
            let history = JSON.parse(localStorage.getItem('previewHistory') || '[]');
            history = history.filter(h => h.id !== id);
            localStorage.setItem('previewHistory', JSON.stringify(history));
            updateHistoryUI();
        }
    });
}

// Restore durations from history
function restoreDurations(durations) {
    // Reset all durations
    wordDurations = {};
    phonemeDurations = {};
    
    // Parse durations and rebuild word/phoneme durations
    let currentWord = '';
    const words = textInput.value.split(' ');
    let wordIndex = 0;
    
    durations.forEach(([phoneme, duration]) => {
        if (phoneme === '<silence>') {
            // Handle silence
            wordDurations['<break/>'] = duration / 100;
        } else {
            // Find which word this phoneme belongs to
            if (!currentWord || !phonemeDurations[currentWord]) {
                currentWord = words[wordIndex++];
                if (!phonemeDurations[currentWord]) {
                    phonemeDurations[currentWord] = {};
                }
            }
            
            phonemeDurations[currentWord][phoneme] = duration / 100;
        }
    });
    
    // Calculate word durations from phoneme durations
    Object.keys(phonemeDurations).forEach(word => {
        const phonemes = Object.values(phonemeDurations[word]);
        if (phonemes.length > 0) {
            wordDurations[word] = phonemes.reduce((a, b) => a + b, 0) / phonemes.length;
        }
    });
}

// Add CSS for spinner
const style = document.createElement('style');
style.textContent = `
    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #5f6368;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .play-btn:disabled .spinner {
        border-color: #9aa0a6;
        border-top-color: transparent;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Modified init function
function init() {
    // Clear any invalid tokens first
    daisysAPI.clearInvalidTokens();
    
    // Initialize default durations
    const words = textInput.value.split(' ');
    words.forEach(word => {
        wordDurations[word] = 1.0; // Default duration multiplier
        
        // Generate phoneme data if needed
        const wordPhonemes = generatePhonemeData(word);
        
        phonemeDurations[word] = {};
        wordPhonemes.forEach(phoneme => {
            phonemeDurations[word][phoneme] = 1.0; // Default phoneme duration
        });
    });
    
    renderWords();
    updatePhonemes(selectedWord);
    addEventListeners();
    addAuthEventListeners();
    addHistoryEventListeners();
    addInitialHelp();
    
    // Update UI based on initial state
    updateAuthUI();
    updateUIState();
    updateHistoryUI();
    
    // Replace the old play button handler
    playBtn.removeEventListener('click', playBtn.onclick);
    playBtn.addEventListener('click', handlePlayClick);
    
    // Check if we're logged in but don't have a voice
    if (daisysAPI.isLoggedIn() && !daisysAPI.voiceId) {
        console.log('Logged in but no voice, creating one...');
        createVoiceWithUI();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Debug function to manually update UI (can be called from console)
window.debugUpdateUI = function() {
    console.log('=== DEBUG UI UPDATE ===');
    console.log('DaisysAPI instance:', daisysAPI);
    console.log('Access token:', daisysAPI.accessToken);
    console.log('Is logged in:', daisysAPI.isLoggedIn());
    console.log('Preview section:', document.querySelector('.preview-section'));
    console.log('Play button:', playBtn);
    
    // Check localStorage directly
    console.log('=== LOCALSTORAGE CHECK ===');
    console.log('Stored access token:', localStorage.getItem('daisys_access_token'));
    console.log('Stored refresh token:', localStorage.getItem('daisys_refresh_token'));
    console.log('Stored username:', localStorage.getItem('daisys_username'));
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    updateAuthUI();
    updateUIState();
    
    console.log('=== END DEBUG ===');
}; 