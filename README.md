# Word Duration Editor

A web-based interface for editing word and phoneme timings for text-to-speech synthesis, integrated with the Daisys API.

## Features

### Core Functionality
- **Word Duration Editing**: Drag handles on word edges to adjust duration
- **Phoneme-Level Control**: Advanced mode allows editing individual phoneme durations
- **Silence Insertion**: Click between words to insert silence/pause blocks
- **Real-time Feedback**: Console logging of phoneme durations as you edit
- **History Management**: Track and restore previous timing configurations

### User Interface
- **Simple Mode**: Focus on word-level timing adjustments
- **Advanced Mode**: Access to phoneme-level editing
- **Authentication**: Secure login with Daisys API credentials
- **Session Persistence**: Maintains login state across browser sessions
- **Hierarchical History**: Browse previous edits organized by date

## Setup

### Prerequisites
- Python 3.8+
- Node.js (optional, for development)

### Installation

1. Clone the repository
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Configuration Options

The application supports multiple configuration methods:

#### 1. Environment Variables (.env file)

Create a `.env` file based on `.env.example`:

```bash
# API URL for Daisys TTS services (default: https://api.daisys.ai)
DAISYS_API_URL=https://api.daisys.ai

# Authentication URL for Daisys login (default: https://api.daisys.ai)
DAISYS_AUTH_URL=https://api.daisys.ai

# Enable mock mode for testing without real API access (default: false)
MOCK_MODE=false

# Mock authentication credentials (only used when MOCK_MODE=true)
MOCK_USERNAME=test@example.com
MOCK_TOKEN=mock_token_for_testing
```

#### 2. URL Parameters

You can override configuration using URL parameters:
- `?mock=true` - Enable mock mode
- `?api_url=https://custom-api.example.com` - Override API URL
- `?auth_url=https://custom-auth.example.com` - Override auth URL

Example: `http://localhost:8000/?mock=true`

## Running the Application

### Development Mode (with Mock API)

1. Create a `.env` file with mock mode enabled:
   ```bash
   MOCK_MODE=true
   ```

2. Start the server:
   ```bash
   python server.py
   ```

3. Open http://localhost:8000 in your browser

4. Login with any username/password (mock mode accepts any credentials)

### Production Mode (with Real Daisys API)

1. Configure your `.env` file with real API endpoints:
   ```bash
   DAISYS_API_URL=https://api.daisys.ai
   DAISYS_AUTH_URL=https://api.daisys.ai
   MOCK_MODE=false
   ```

2. Start the server:
   ```bash
   python server.py
   ```

3. Login with your Daisys API credentials

## Usage Guide

### Initial Setup
1. Click "Login" in the top right corner
2. Enter your credentials (or any credentials in mock mode)
3. The interface will show "Generate" button once logged in

### Editing Workflow
1. Enter or modify text in the input field
2. Click "Generate" to generate initial speech
3. The timing interface will appear with draggable word blocks
4. Adjust timings by:
   - Dragging word edges (blue handles)
   - Using the speed slider for selected words
   - Clicking words to select them
   - Inserting silence with "+" buttons between words

### Advanced Features
- **Switch Modes**: Toggle between Simple and Advanced modes
- **Phoneme Editing**: In Advanced mode, edit individual phoneme durations
- **History**: View and restore previous timing configurations
- **Reset**: Click the reset button (↺) on modified words/phonemes

## API Integration

The application integrates with Daisys API for:
- User authentication (`/auth/login`)
- Voice management (`/v1/speak/voices`)
- TTS generation (`/v1/speak/takes/generate`)

### Authentication Flow
1. Login credentials are sent to the auth endpoint
2. Access and refresh tokens are stored in localStorage
3. Tokens are included in subsequent API requests

### TTS Generation
1. Text and timing information are sent to the TTS endpoint
2. Audio URL is returned and played in the browser
3. Timing data is stored in history for later retrieval

## Development

### Project Structure
```
/workspace/
├── index.html          # Main HTML interface
├── css/
│   └── styles.css      # UI styling
├── js/
│   ├── config.js       # Configuration loader
│   ├── daisys-api.js   # API integration
│   └── app.js          # Main application logic
├── server.py           # FastAPI server
├── requirements.txt    # Python dependencies
├── .env.example        # Environment configuration template
└── README.md           # This file
```

### Mock Mode Features
When `MOCK_MODE=true`:
- Authentication accepts any credentials
- TTS returns silent audio placeholders
- No actual API calls are made
- Useful for UI development and testing

### Extending the Application
- **Custom Phoneme Mappings**: Edit the phoneme data in `app.js`
- **New TTS Models**: Modify voice creation in `daisys-api.js`
- **Additional UI Features**: Extend the interface in `index.html` and `styles.css`

## Troubleshooting

### Login Issues
- Check console for error messages
- Verify API URLs in configuration
- Ensure CORS is properly configured on API server
- Try mock mode to isolate authentication issues

### TTS Generation Failures
- Verify access token is valid
- Check API quotas and limits
- Monitor console for detailed error messages
- Test with mock mode to ensure UI works correctly

### UI Not Updating
- Clear browser cache and localStorage
- Check for JavaScript errors in console
- Verify all script files are loading correctly
- Ensure server is running and accessible

## Future Enhancements
- Real-time waveform visualization
- Export/import timing configurations
- Batch processing for multiple sentences
- Integration with additional TTS providers
- WebSocket support for real-time updates
