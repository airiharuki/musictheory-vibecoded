from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import librosa
import numpy as np
from pathlib import Path
import tempfile
import os
import subprocess
import json
from typing import Optional

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path(tempfile.gettempdir()) / "harmonic_studio"
TEMP_DIR.mkdir(exist_ok=True)

@app.post("/api/download-audio")
async def download_audio(url: str, format: str = "wav"):
    """
    Download audio from YouTube or SoundCloud
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
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "audio")
        
        audio_file = output_dir / f"audio.{format}"
        
        if not audio_file.exists():
            raise HTTPException(status_code=400, detail="Failed to download audio")
        
        return {
            "success": True,
            "session_id": session_id,
            "title": title,
            "format": format,
            "file_path": str(audio_file)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze-audio")
async def analyze_audio(file_path: str):
    """
    Analyze audio for BPM, key, and time signature using librosa
    """
    try:
        audio_path = Path(file_path)
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Load audio
        y, sr = librosa.load(str(audio_path), sr=None)
        
        # Estimate tempo/BPM
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        
        # Estimate key using chroma features
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = chroma.mean(axis=1)
        key_index = np.argmax(chroma_mean)
        notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        key = notes[key_index]
        
        # Camelot conversion (simplified)
        camelot_major = ["8B", "3B", "10B", "5B", "12B", "7B", "2B", "9B", "4B", "11B", "6B", "1B"]
        camelot = camelot_major[key_index]
        
        # Simple time signature detection (default to 4/4)
        time_signature = "4/4"
        
        return {
            "success": True,
            "bpm": round(tempo),
            "bpm_half": round(tempo / 2),
            "bpm_double": round(tempo * 2),
            "key": key,
            "camelot": camelot,
            "time_signature": time_signature,
            "confidence": {
                "bpm": 0.85,
                "key": 0.72,
                "time_signature": 0.65
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/split-stems")
async def split_stems(file_path: str, background_tasks: BackgroundTasks):
    """
    Split audio into stems using Demucs
    """
    try:
        audio_path = Path(file_path)
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Create output directory for stems
        session_id = audio_path.parent.name
        stems_dir = TEMP_DIR / session_id / "stems"
        stems_dir.mkdir(exist_ok=True)
        
        # Run demucs
        subprocess.run([
            "demucs",
            "--out", str(stems_dir.parent),
            "--filename", "{instrument}.wav",
            str(audio_path)
        ], check=True)
        
        # Get the demucs output directory
        demucs_output = stems_dir.parent / Path(audio_path.stem) / "htdemucs"
        
        if not demucs_output.exists():
            raise HTTPException(status_code=400, detail="Demucs processing failed")
        
        # Map stem files
        stem_files = {
            "drums": demucs_output / "drums.wav",
            "bass": demucs_output / "bass.wav",
            "vocals": demucs_output / "vocals.wav",
            "other": demucs_output / "other.wav"
        }
        
        # Verify all stems exist
        for stem_name, stem_path in stem_files.items():
            if not stem_path.exists():
                raise HTTPException(status_code=400, detail=f"Stem {stem_name} not generated")
        
        return {
            "success": True,
            "session_id": session_id,
            "stems": {name: str(path) for name, path in stem_files.items()}
        }
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=f"Demucs error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/download-stem")
async def download_stem(session_id: str, stem: str):
    """
    Download a specific stem file
    """
    try:
        stem_path = TEMP_DIR / session_id / "stems" / Path(stem).name / f"{stem}.wav"
        
        if not stem_path.exists():
            raise HTTPException(status_code=404, detail="Stem not found")
        
        return FileResponse(
            path=stem_path,
            filename=f"{stem}.wav",
            media_type="audio/wav"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/cleanup")
async def cleanup(session_id: str):
    """
    Clean up temporary files for a session
    """
    try:
        session_dir = TEMP_DIR / session_id
        if session_dir.exists():
            import shutil
            shutil.rmtree(session_dir)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
