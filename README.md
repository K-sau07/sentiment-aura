# Sentiment Aura

A real-time AI-powered application that visualizes emotional sentiment through live audio transcription and generative art.

**Live Demo:** https://livesentimentaura.vercel.app

## Overview

This application captures spoken audio, transcribes it in real-time, analyzes the emotional sentiment using AI, and visualizes the results through an interactive Perlin noise particle system. Different emotions trigger unique colors and movement patterns, creating a dynamic visual representation of speech.

## Features

- Real-time audio transcription using Deepgram WebSocket API
- AI-powered sentiment analysis with Groq LLM
- Perlin noise visualization that changes color, energy, and form based on detected emotions
- Support for 30+ different emotion types with unique visual representations
- Smooth animations and transitions throughout the UI
- Keywords extracted and displayed with staggered fade-in effects

## Architecture

This is a full-stack application with three main components:

1. **Frontend (React + p5.js)**: Handles audio capture, manages WebSocket connections, displays UI, and renders the visualization
2. **Backend (Node.js/Express)**: Proxy server that receives text from frontend and securely calls the Groq API
3. **External APIs**: Deepgram for transcription, Groq for sentiment analysis

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Deepgram API key
- Groq API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/K-sau07/sentiment-aura.git
   cd sentiment-aura
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:

   **Backend** - Create `backend/.env`:
   ```
   GROQ_API_KEY=your_groq_api_key
   PORT=5000
   ```

   **Frontend** - Create `frontend/.env`:
   ```
   REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

### Running Locally

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Open http://localhost:3000 in your browser

## How It Works

1. User clicks "Start Recording" and grants microphone access
2. Audio is streamed to Deepgram via WebSocket for real-time transcription
3. Transcribed text appears in the Live Sentiment Aura panel
4. When a complete sentence is detected, it's sent to the backend
5. Backend forwards the text to Groq API for sentiment analysis
6. Groq returns sentiment score, emotion label, and keywords
7. Frontend updates the visualization with new data
8. Perlin noise particles change color based on emotion
9. Particle speed and flow pattern adjust based on sentiment intensity
10. Keywords fade in one by one in the Keywords panel

## Visualization Details

The Perlin noise visualization responds to sentiment in three ways:

- **Color**: 30+ unique colors mapped to specific emotions (joy = yellow, anger = red, sadness = blue, etc.)
- **Energy**: Particle speed varies from 0.3x (idle) to 3.5x (intense emotion)
- **Form**: Flow field scale changes based on emotion type (smooth for joy, chaotic for anger)

## Tech Stack

- React
- p5.js with react-p5
- Node.js & Express
- Deepgram API (WebSocket transcription)
- Groq API (LLM sentiment analysis)
- Web Audio API
- Canvas API

## Deployment

**Frontend:** Deployed on Vercel
**Backend:** Deployed on Vercel as serverless function

Live URL: https://frontend-dun-kappa-93.vercel.app

## Project Structure

```
sentiment-aura/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuraVisualization.js
│   │   │   ├── TranscriptDisplay.js
│   │   │   ├── KeywordsDisplay.js
│   │   │   └── Controls.js
│   │   └── App.js
│   └── package.json
├── backend/
│   ├── server.js
│   └── package.json
└── README.md
```

## License

MIT

---

Built by Saurabh Kashyap for Memory Machines Co-op Application
