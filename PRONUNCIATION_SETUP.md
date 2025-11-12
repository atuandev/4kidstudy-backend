# Pronunciation Assessment API - Setup Guide

## Prerequisites

### Install FFmpeg

The pronunciation assessment API converts MP3 audio to WAV format before processing. This requires FFmpeg to be installed on your system.

#### Windows

**Option 1: Using Chocolatey (Recommended)**
```powershell
choco install ffmpeg
```

**Option 2: Manual Installation**
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Extract the ZIP file
3. Add the `bin` folder to your system PATH
4. Verify installation:
```powershell
ffmpeg -version
```

#### macOS

```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

## Configuration

Make sure your `.env` file contains:

```env
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here  # e.g., eastus, westus, etc.
```

## API Usage

### Endpoint

`POST /api/pronunciation/assess`

### Request

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `audioFile`: MP3 audio file (max 10MB)
  - `referenceText`: The correct text that should be spoken

### Example using cURL

```bash
curl -X POST http://localhost:3001/api/pronunciation/assess \
  -F "audioFile=@./audio.mp3" \
  -F "referenceText=Hello world"
```

### Response

```json
{
  "success": true,
  "accuracy": 85.5,
  "fluency": 78.3,
  "completeness": 90.0,
  "prosody": 82.7,
  "overall": 84.1,
  "recognizedText": "Hello world",
  "words": [
    {
      "word": "Hello",
      "accuracy": 88.2,
      "errorType": null
    },
    {
      "word": "world",
      "accuracy": 82.8,
      "errorType": null
    }
  ]
}
```

## Features

✅ **MP3 Support**: Upload MP3 files directly - automatic conversion to WAV
✅ **Detailed Scoring**: Get accuracy, fluency, completeness, prosody, and overall scores
✅ **Word-Level Analysis**: See individual word scores and error types
✅ **Phoneme Granularity**: Detailed pronunciation assessment at phoneme level
✅ **Swagger Documentation**: Full API documentation at `/api/docs`

## Troubleshooting

### FFmpeg not found

**Error**: `Cannot find ffmpeg`

**Solution**: Make sure FFmpeg is installed and available in your system PATH. Test with:
```bash
ffmpeg -version
```

### Azure Speech credentials not configured

**Error**: `Azure Speech credentials are not configured`

**Solution**: Check your `.env` file contains valid `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.

### Audio format not supported

**Error**: `Audio conversion failed`

**Solution**: Make sure you're uploading a valid MP3 file. The API expects standard MP3 format.

## Technical Details

- **Input Format**: MP3 audio (any sample rate, channels)
- **Processing Format**: WAV 16kHz, 16-bit, mono (automatically converted)
- **Azure SDK**: Microsoft Cognitive Services Speech SDK
- **Assessment Engine**: Azure Speech Service Pronunciation Assessment
