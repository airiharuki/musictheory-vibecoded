# Deployment Guide for Harmonic Studio

This guide explains how to deploy Harmonic Studio to Vercel with the Python backend using `experimentalServices`.

## Prerequisites

- A Vercel account (https://vercel.com)
- GitHub repository with your Harmonic Studio code
- Project already connected to Vercel

## Deployment Steps

### 1. Update Framework Preset on Vercel

After pushing your code to GitHub:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Build and Deployment**
3. Under "Framework Preset", select **Services** (not Next.js)
4. This tells Vercel to use `experimentalServices` from your `vercel.json`

### 2. Set Environment Variables (if needed in future)

If your backend requires environment variables:

1. In Vercel dashboard, go to **Settings > Environment Variables**
2. Add any required variables (e.g., API keys for future Demucs API)
3. These will be available to both frontend and backend

### 3. Deploy

Simply push to your GitHub branch connected to Vercel:

```bash
git push origin your-branch-name
```

Vercel will automatically:
- Install Next.js dependencies from `package.json`
- Install Python dependencies from `python-backend/pyproject.toml`
- Start both services based on `vercel.json`
- Route `/api/*` requests to the Python backend
- Route `/` requests to the Next.js frontend

## Project Structure

```
harmonic-studio/
├── vercel.json                    # Services configuration
├── package.json                   # Frontend dependencies
├── app/                          # Next.js app
│   ├── page.tsx                  # Composer page
│   ├── analyze/page.tsx          # Analyzer page
│   └── stems/page.tsx            # Stems page
├── python-backend/
│   ├── main.py                   # FastAPI backend
│   └── pyproject.toml            # Python dependencies
```

## How It Works

1. **Frontend** (Next.js) runs on `/`
2. **Backend** (FastAPI) runs on `/api/*`
3. Vercel automatically routes requests based on `vercel.json` config
4. No need for localhost URLs or manual proxy setup

### Example API Calls from Frontend

```typescript
// Frontend code automatically calls the backend via Vercel routing
const response = await fetch("/api/analyze-audio", {
  method: "POST",
  body: JSON.stringify({ url: "https://youtube.com/..." })
})
```

Vercel strips the `/api` prefix before sending to backend, so the backend just sees `/analyze-audio`.

## Troubleshooting

### 404 Errors After Deployment

**Solution**: Ensure "Framework Preset" is set to **Services** in your Vercel project settings.

### Backend Returns 500 Errors

1. Check Vercel Function logs:
   - Dashboard > Deployments > Your deployment > Python function
2. Common issues:
   - FFmpeg not available (use system-based audio processing)
   - Python dependencies not installed (check `pyproject.toml`)
   - File permissions in temp directories

### Frontend Can't Reach Backend

1. Check that routes in `vercel.json` match your code
2. Verify `fetch("/api/...")` URLs in components
3. Check browser console for CORS errors (should be handled by FastAPI middleware)

## Production Considerations

### Audio Processing Limitations

- **Current**: Uses `yt-dlp` for downloading, `librosa` for basic analysis
- **Limitations on Vercel**: Demucs stem splitting requires significant compute
- **Solution for production**: Use dedicated audio API services:
  - Demucs API (demucs.sh)
  - Essentia Online
  - ACRCloud
  - Splice API

### Temporary File Cleanup

Backend automatically cleans up files older than 1 hour. For longer-running tasks, consider:

- Streaming responses instead of storing files
- Using cloud storage (S3, Vercel Blob)
- Implementing job queues with background processing

### Scaling

If you exceed computational limits:

1. Use managed services for audio processing
2. Implement request queuing
3. Add caching for repeated analyses
4. Consider separate backend deployment on cheaper compute (Railway, Render)

## Local Development

To test locally before deployment:

```bash
# Install dependencies
npm install
cd python-backend && pip install -e . && cd ..

# Run development server (vercel dev handles both services automatically)
vercel dev

# Frontend will be at http://localhost:3000
# Backend at http://localhost:3000/api/
```

## Next Steps

After deployment is working:

1. Test with provided YouTube/SoundCloud URLs
2. Integrate real Demucs API for stem splitting
3. Add user authentication for saved analyses
4. Implement caching layer for popular tracks
