# DAISYS Speech Editing Demo

A web-based interface for editing speech timing at the phoneme level using the DAISYS TTS API.

## Features

- Visual word and phoneme duration editing via drag handles
- Real-time speech regeneration with edited timings
- Prosody controls (pitch, pace, expression)
- Session history with full state restoration
- SIL (silence) token manipulation
- Authentication with DAISYS API

## Demo

Once deployed to GitHub Pages, you can access the demo at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv
   ```
3. Copy `.env.example` to `.env` and configure your DAISYS API endpoints
4. Run the server:
   ```bash
   python server.py
   ```
5. Open http://localhost:8001 in your browser

## GitHub Pages Deployment

The app is automatically deployed to GitHub Pages when you push to the main branch.

### Configuring the Deployed App

Since GitHub Pages serves static files, you can configure the API endpoints using URL parameters:

```
https://YOUR_USERNAME.github.io/YOUR_REPO/?api_url=YOUR_API_URL&auth_url=YOUR_AUTH_URL
```

For example:
```
https://example.github.io/daisys-demo/?api_url=https://api.daisys.com&auth_url=https://auth.daisys.com
```

### Mock Mode

To test the UI without a real DAISYS API, enable mock mode:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/?mock=true
```

## Requirements

- Python 3.7+ with FastAPI (for local development)
- DAISYS API credentials (for real speech generation)
- Modern web browser with JavaScript enabled

## Usage

1. **Login**: Click the login button and enter your DAISYS credentials
2. **Enter Text**: Type the text you want to synthesize
3. **Generate**: Click "Generate" to create the initial speech
4. **Edit Timing**: 
   - Click on words to select them
   - Drag the blue handles on word edges to adjust duration
   - Click "Show phonemes" to edit individual phoneme durations
   - Drag SIL tokens to adjust silence duration
5. **Regenerate**: Click "Regenerate" to synthesize with your timing edits
6. **History**: Previous generations are saved and can be restored

## API Configuration

The app requires two endpoints:
- `DAISYS_API_URL`: The main DAISYS API endpoint for TTS generation
- `DAISYS_AUTH_URL`: The authentication endpoint for login

These can be configured via:
1. Environment variables in `.env` file (local development)
2. URL parameters (GitHub Pages deployment)
3. Mock mode for testing without API access

## License

This demo is provided as-is for educational and testing purposes.
