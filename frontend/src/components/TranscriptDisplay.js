import React, { useEffect, useRef } from 'react';
import './TranscriptDisplay.css';

const TranscriptDisplay = ({ transcript }) => {
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  return (
    <div className="transcript-display">
      <h3 className="transcript-title">Live Sentiment Aura</h3>
      <div className="transcript-content">
        {!Array.isArray(transcript) || transcript.length === 0 ? (
          <p className="transcript-placeholder">
            Start speaking to see your words appear here...
          </p>
        ) : (
          transcript.map((item, index) => (
            <p 
              key={index} 
              className={`transcript-line ${item.isFinal ? 'final' : 'interim'}`}
            >
              {item.text}
            </p>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};

export default TranscriptDisplay;
