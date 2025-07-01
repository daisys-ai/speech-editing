from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Mount static files for CSS and JS
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

# Serve index.html at root with injected environment variables
@app.get("/")
async def read_index():
    # Read the index.html file
    with open("index.html", "r") as f:
        html_content = f.read()
    
    # Prepare environment variables to inject
    env_vars = {
        "DAISYS_API_URL": os.getenv("DAISYS_API_URL", ""),
        "DAISYS_AUTH_URL": os.getenv("DAISYS_AUTH_URL", ""),
        "MOCK_MODE": os.getenv("MOCK_MODE", "false"),
        "MOCK_USERNAME": os.getenv("MOCK_USERNAME", ""),
        "MOCK_TOKEN": os.getenv("MOCK_TOKEN", "")
    }
    
    # Inject environment variables into the HTML
    env_script = f"""
    <script>
        window.ENV = {env_vars};
    </script>
    """
    
    # Insert the script before the closing head tag
    html_content = html_content.replace("</head>", f"{env_script}</head>")
    
    return HTMLResponse(content=html_content)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)