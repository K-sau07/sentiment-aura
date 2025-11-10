import React, { useState, useEffect } from 'react';
import './KeywordsDisplay.css';

const KeywordsDisplay = ({ keywords }) => {
  const [displayedKeywords, setDisplayedKeywords] = useState([]);

  useEffect(() => {
    // when keywords change, animate them in one by one
    if (Array.isArray(keywords) && keywords.length > 0) {
      // clear existing keywords first
      setDisplayedKeywords([]);
      
      // add each keyword with a delay to create staggered animation
      keywords.forEach((keyword, index) => {
        setTimeout(() => {
          setDisplayedKeywords(prev => [...prev, keyword]);
        }, index * 200); // 200ms delay between each keyword
      });
    } else {
      setDisplayedKeywords([]);
    }
  }, [keywords]);

  if (displayedKeywords.length === 0) {
    return null;
  }

  return (
    <div className="keywords-display">
      <h3 className="keywords-title">KEYWORDS</h3>
      <div className="keywords-container">
        {displayedKeywords.map((keyword, index) => (
          <div
            key={`${keyword}-${index}`}
            className="keyword-tag"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            {keyword}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordsDisplay;
