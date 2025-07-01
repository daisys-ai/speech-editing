# Word Duration Prototype

A minimalistic prototype for adjusting word durations in text, designed with both simple and advanced modes to accommodate different user needs.

## Overview

This prototype allows users to:

1. Input text for speech synthesis
2. Adjust the duration of individual words by dragging or using sliders
3. Visually see the duration of each word represented as a waveform
4. Preview the timing of the speech
5. Switch between simple and advanced modes

## Features

### Simple Mode
- Focus on adjusting whole word durations
- Phonemes are hidden by default (but can be toggled)
- Clean, minimalistic interface for casual users

### Advanced Mode
- Access to phoneme-level editing
- Automatically displays phonemes for selected words
- More precise control for technical users

## Implementation Details

- Pure HTML, CSS, and JavaScript
- Drag handles on both sides of words and phonemes for intuitive resizing
- Visual waveform representations for each word
- Responsive design that works on different screen sizes

## Usage

1. Enter text in the input field
2. Click on a word to select it
3. Adjust the duration by:
   - Dragging the left or right handles of the word
   - Using the slider at the bottom
   - In advanced mode, directly manipulating individual phonemes
4. Click "Preview timing" to see how the adjustments would sound

## Future Enhancements

- Integration with a real text-to-speech engine
- Save and load presets for different speaking styles
- Visual indication of timing changes in the waveform
- More advanced phoneme editing options
- Audio visualization during playback

## How to Run

Simply open the `index.html` file in a web browser. 