import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import AuraVisualization from './components/AuraVisualization';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

function App() {
  // state management for the entire app
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sentiment, setSentiment] = useState(0);
  const [sentimentLabel, setSentimentLabel] = useState('neutral');
  const [emotion, setEmotion] = useState('neutral');
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // refs for managing WebSocket and media stream
  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const speakingTimeoutRef = useRef(null);

  // cleanup function to stop recording and close connections
  const cleanup = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // start recording and establish WebSocket connection to Deepgram
  const startRecording = async () => {
    try {
      setError(null);
      
      if (!DEEPGRAM_API_KEY) {
        throw new Error('Deepgram API key is not configured.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      streamRef.current = stream;

      // create WebSocket connection to Deepgram - let it auto-detect format
      const ws = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true', [
        'token',
        DEEPGRAM_API_KEY
      ]);

      websocketRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);

        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250);
      };

      // handle incoming transcription results from Deepgram
      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        
        if (data.type === 'Error') {
          setError(`Deepgram error: ${data.description}`);
          return;
        }
        
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;

        if (transcriptText && transcriptText.trim()) {
          const isFinal = data.is_final;
          
          // user is speaking! activate speaking state
          setIsSpeaking(true);
          
          // clear existing timeout
          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
          }
          
          // set timeout to return to recording state after 2 seconds of silence
          speakingTimeoutRef.current = setTimeout(() => {
            setIsSpeaking(false);
          }, 2000);
          
          // add to transcript display
          setTranscript(prev => [...prev, { text: transcriptText, isFinal }]);

          // if it's a final transcript, send to backend for sentiment analysis
          if (isFinal) {
            await processText(transcriptText);
          }
        }
      };

      ws.onerror = (error) => {
        setError('Connection error occurred');
      };

      ws.onclose = (event) => {
        // connection closed, reset recording state if needed
      };

    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  // stop recording and close connections
  const stopRecording = () => {
    cleanup();
    setIsRecording(false);
    setIsSpeaking(false);
    
    // Reset to neutral state after stopping
    setTimeout(() => {
      setSentiment(0);
      setSentimentLabel('neutral');
      setEmotion('Neutral');
      setKeywords([]);
      setTranscript([]);
    }, 500);
  };

  // send text to backend for sentiment analysis
  const processText = async (text) => {
    if (!text || text.trim().length === 0) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/process_text`, {
        text: text
      });

      const data = response.data;

      // update app state with the sentiment analysis results
      setSentiment(data.sentiment || 0);
      setSentimentLabel(data.sentimentLabel || 'neutral');
      setEmotion(data.emotion || 'neutral');
      setKeywords(data.keywords || []);

    } catch (err) {
      // if backend fails, just keep current state - don't crash the visualization
      console.error('Sentiment analysis failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // calculate screen glow intensity based on sentiment
  const getGlowIntensity = () => {
    const intensity = Math.abs(sentiment);
    if (intensity > 0.7) return 0.15;
    if (intensity > 0.4) return 0.08;
    return 0;
  };

  const getGlowColor = () => {
    if (sentiment > 0.3) return '64, 224, 208';
    if (sentiment < -0.3) return '255, 64, 129';
    return '102, 126, 234';
  };

  return (
    <div className="App">
      {/* Emotional screen glow overlay */}
      {Math.abs(sentiment) > 0.3 && (
        <div 
          className="emotion-glow"
          style={{
            opacity: getGlowIntensity(),
            background: `radial-gradient(circle at center, rgba(${getGlowColor()}, 0.3), transparent 70%)`
          }}
        />
      )}
      
      {/* Background visualization */}
      <AuraVisualization 
        sentiment={sentiment}
        sentimentLabel={sentimentLabel}
        emotion={emotion}
        keywords={keywords}
        isRecording={isRecording}
        isSpeaking={isSpeaking}
      />

      {/* UI overlay */}
      <div className="ui-overlay">
        <div className="header">
          <h1 className="title">Sentiment Aura</h1>
          <p className="subtitle">Real-time emotional visualization</p>
        </div>

        <Controls 
          isRecording={isRecording}
          onStart={startRecording}
          onStop={stopRecording}
          isProcessing={isProcessing}
        />

        <TranscriptDisplay transcript={transcript} />

        <KeywordsDisplay keywords={keywords} />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="sentiment-info">
          <div className="sentiment-bar">
            <div 
              className="sentiment-fill"
              style={{
                width: `${Math.min(Math.max(Math.abs(sentiment) * 150, 8), 100)}%`,
                background: (() => {
                  const emotionLower = emotion?.toLowerCase() || '';
                  if (emotionLower.includes('joy') || emotionLower.includes('happy')) {
                    return 'linear-gradient(90deg, #ffd700, #ffc800, #ffb700)';
                  }
                  if (emotionLower.includes('love') || emotionLower.includes('affection')) {
                    return 'linear-gradient(90deg, #ff66b2, #ff4d9f, #ff3399)';
                  }
                  if (emotionLower.includes('anger') || emotionLower.includes('angry')) {
                    return 'linear-gradient(90deg, #ff5555, #ff3c3c, #ff1111)';
                  }
                  if (emotionLower.includes('sad') || emotionLower.includes('sorrow')) {
                    return 'linear-gradient(90deg, #6688ff, #5577ff, #4466ff)';
                  }
                  if (emotionLower.includes('fear') || emotionLower.includes('anxiety')) {
                    return 'linear-gradient(90deg, #aa77cc, #9966cc, #8855bb)';
                  }
                  if (emotionLower.includes('surprise') || emotionLower.includes('amazed')) {
                    return 'linear-gradient(90deg, #44ddff, #32dcff, #22bbff)';
                  }
                  if (emotionLower.includes('curiosity') || emotionLower.includes('curious')) {
                    return 'linear-gradient(90deg, #66ff99, #64ff96, #44ff77)';
                  }
                  if (sentiment > 0.3) return 'linear-gradient(90deg, #78ff96, #66ff88, #55ee77)';
                  if (sentiment < -0.3) return 'linear-gradient(90deg, #ff6478, #ff5566, #ff4455)';
                  return 'linear-gradient(90deg, #88aaff, #78b4ff, #6688ff)';
                })()
              }}
            />
          </div>
          <p 
            className="emotion-label"
            style={{
              color: (() => {
                const emotionLower = emotion?.toLowerCase() || '';
                if (emotionLower.includes('joy')) return '#ffc800';
                if (emotionLower.includes('love')) return '#ff64b4';
                if (emotionLower.includes('anger')) return '#ff3c3c';
                if (emotionLower.includes('sad')) return '#6478ff';
                if (emotionLower.includes('fear')) return '#9664c8';
                if (emotionLower.includes('surprise')) return '#32dcff';
                if (emotionLower.includes('curiosity')) return '#64ff96';
                if (sentiment > 0.3) return '#78ff96';
                if (sentiment < -0.3) return '#ff6478';
                return '#78b4ff';
              })()
            }}
          >
            {emotion}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
