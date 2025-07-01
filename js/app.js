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
    
    words.forEach(word => {
        // Check if word duration has been modified from default
        const isModified = wordDurations[word] && Math.abs(wordDurations[word] - 1.0) > 0.05;
        const isSelected = word === selectedWord;
        
        const wordBox = document.createElement('div');
        wordBox.className = `word-box ${isSelected ? 'selected' : ''}`;
        wordBox.dataset.word = word;
        wordBox.innerHTML = `
            <div class="word-content">
                <div>${word}</div>
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
    selectedWordElem.textContent = `"${word}"`;
    
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
    
    // Word selection
    wordDisplay.addEventListener('click', e => {
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 