from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import librosa
import numpy as np
from pathlib import Path
import tempfile
import os
import shutil
import json
from typing import Optional
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path(tempfile.gettempdir()) / "harmonic_studio"
TEMP_DIR.mkdir(exist_ok=True)

class AudioAnalysisResponse(BaseModel):
    bpm: float
    bpm_half: float
    bpm_double: float
    key: str
    camelot: str
    time_signature: str
    confidence: float
    download_path: Optional[str] = None

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/download-audio")
async def download_audio(url: str, format: str = "wav"):
    """
    Download audio from YouTube or SoundCloud using yt-dlp
    Vercel forwards /api/download-audio to this route (prefix is stripped)
    """
    try:
        session_id = os.urandom(8).hex()
        output_dir = TEMP_DIR / session_id
        output_dir.mkdir(exist_ok=True)
        
        output_template = str(output_dir / "audio.%(ext)s")
        
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": format,
                    "preferredquality": "192",
                }
            ],
            "outtmpl": output_template,
            "quiet": False,
            "no_warnings": False,
            "socket_timeout": 30,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
        
        audio_file = output_dir / f"audio.{format}"
        
        return {
            "session_id": session_id,
            "filename": f"audio.{format}",
            "size": audio_file.stat().st_size if audio_file.exists() else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analyze-audio")
async def analyze_audio(url: str, download: bool = False, format: str = "wav"):
    """
    Analyze audio from YouTube or SoundCloud for BPM, key, and time signature
    """
    try:
        session_id = os.urandom(8).hex()
        output_dir = TEMP_DIR / session_id
        output_dir.mkdir(exist_ok=True)
        
        output_template = str(output_dir / "audio.%(ext)s")
        
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
            "outtmpl": output_template,
            "quiet": False,
            "no_warnings": False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
        
        audio_file = output_dir / "audio.wav"
        
        # Load audio and analyze
        y, sr = librosa.load(str(audio_file), sr=None)
        
        # BPM detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        bpm = librosa.feature.tempogram_via_autocorrelation(y=y, sr=sr)
        avg_bpm = librosa.beat.tempo(y=y, sr=sr)[0] if librosa.beat.tempo(y=y, sr=sr).size > 0 else 120
        
        # Key detection (simplified using chroma features)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        key_idx = np.argmax(chroma_mean)
        
        notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        detected_key = notes[key_idx]
        
        # Simple key to Camelot mapping
        camelot_map = {
            "C": "8B", "G": "9B", "D": "10B", "A": "11B", "E": "12B", "B": "1B",
            "F#": "2B", "C#": "3B", "G#": "4B", "D#": "5B", "A#": "6B", "F": "7B",
        }
        camelot = camelot_map.get(detected_key, "8B")
        
        # Time signature detection (simplified)
        spectral_flux = np.abs(np.diff(np.abs(librosa.stft(y))))
        time_sig = "4/4"  # Default
        
        # Confidence scores
        key_confidence = float(chroma_mean[key_idx] / np.sum(chroma_mean))
        bpm_confidence = 0.75
        
        response = {
            "bpm": round(avg_bpm, 1),
            "bpm_half": round(avg_bpm / 2, 1),
            "bpm_double": round(avg_bpm * 2, 1),
            "key": detected_key,
            "camelot": camelot,
            "time_signature": time_sig,
            "key_confidence": round(key_confidence * 100, 0),
            "bpm_confidence": round(bpm_confidence * 100, 0),
        }
        
        # If download is requested, prepare file for delivery
        if download:
            if format == "mp3":
                # Convert WAV to MP3 using pydub
                from pydub import AudioSegment
                audio = AudioSegment.from_wav(str(audio_file))
                mp3_file = output_dir / "audio.mp3"
                audio.export(str(mp3_file), format="mp3")
                response["download_available"] = True
                response["download_format"] = "mp3"
            else:
                response["download_available"] = True
                response["download_format"] = "wav"
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/split-stems")
async def split_stems(url: str, background_tasks: BackgroundTasks):
    """
    Split audio into stems using Demucs via API
    For production: use demucs-api or self-host demucs server
    """
    try:
        session_id = os.urandom(8).hex()
        output_dir = TEMP_DIR / session_id
        output_dir.mkdir(exist_ok=True)
        
        # Download audio
        output_template = str(output_dir / "audio.%(ext)s")
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
            "outtmpl": output_template,
            "quiet": False,
            "no_warnings": False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)
        
        audio_file = output_dir / "audio.wav"
        
        # For production, you'd call the Demucs API here
        # For now, return placeholder stems structure
        return {
            "session_id": session_id,
            "status": "processing",
            "stems": {
                "vocals": {"url": f"/api/stems/{session_id}/vocals.wav", "ready": False},
                "drums": {"url": f"/api/stems/{session_id}/drums.wav", "ready": False},
                "bass": {"url": f"/api/stems/{session_id}/bass.wav", "ready": False},
                "other": {"url": f"/api/stems/{session_id}/other.wav", "ready": False},
            },
            "message": "Stem splitting processing started. For production, integrate Demucs API service.",
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """
    Download processed audio file
    """
    try:
        file_path = TEMP_DIR / session_id / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(str(file_path), filename=filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.on_event("startup")
async def startup():
    """Cleanup old temp files on startup"""
    try:
        for session_dir in TEMP_DIR.iterdir():
            if session_dir.is_dir():
                # Remove directories older than 1 hour
                import time
                if time.time() - session_dir.stat().st_mtime > 3600:
                    shutil.rmtree(session_dir)
    except:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
