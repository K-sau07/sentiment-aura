import React from 'react';
import './Controls.css';

const Controls = ({ isRecording, onStart, onStop, isProcessing }) => {
  return (
    <div className="controls">
      {!isRecording ? (
        <button 
          className="control-button start-button" 
          onClick={onStart}
        >
          <div className="button-content">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span>Start Recording</span>
          </div>
        </button>
      ) : (
        <button 
          className="control-button stop-button" 
          onClick={onStop}
        >
          <div className="button-content">
            <div className="recording-indicator">
              <div className="pulse-ring"></div>
              <div className="pulse-dot"></div>
            </div>
            <span>Stop Recording</span>
          </div>
        </button>
      )}
      
      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Analyzing...</span>
        </div>
      )}
    </div>
  );
};

export default Controls;
