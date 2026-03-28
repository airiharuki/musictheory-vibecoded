#!/bin/bash

# Initialize Python project
cd "$(dirname "$0")/.."
uv init --bare python-backend

# Add dependencies for audio processing
uv add fastapi uvicorn python-multipart yt-dlp librosa numpy scipy demucs pydantic

echo "Python backend dependencies installed!"
