import React, { useRef } from 'react';
import Sketch from 'react-p5';
import './AuraVisualization.css';

const AuraVisualization = ({ sentiment, sentimentLabel, emotion, keywords, isRecording, isSpeaking }) => {
  const particlesRef = useRef([]);
  const timeRef = useRef(0);
  const domeGraphicsRef = useRef(null);

  // determine animation speed based on user state
  const getEnergyLevel = () => {
    if (!isSpeaking && !isRecording) return 0.3; // slow movement when idle
    if (isRecording && !isSpeaking) return 0.6; // moderate when listening
    
    const absSentiment = Math.abs(sentiment);
    
    // higher emotion intensity = faster particle movement
    if (absSentiment > 0.7) return 3.5;
    if (absSentiment > 0.4) return 2.5;
    return 1.5;
  };

  // different emotions get different flow patterns
  const getFlowScale = () => {
    const emotionLower = emotion?.toLowerCase() || '';
    
    // intense emotions like anger create tighter, more chaotic flow
    if (emotionLower.includes('anger') || emotionLower.includes('fear')) return 0.005;
    // calm emotions like joy create smoother, larger patterns
    if (emotionLower.includes('joy') || emotionLower.includes('love')) return 0.002;
    return 0.003;
  };

  // map emotions to unique colors for visualization
  const getSentimentColor = () => {
    const emotionLower = emotion?.toLowerCase() || '';
    
    // positive emotions get warm, bright colors
    if (emotionLower.includes('joy') || emotionLower.includes('happy') || emotionLower.includes('happiness')) return { r: 255, g: 200, b: 50 };
    if (emotionLower.includes('love') || emotionLower.includes('affection')) return { r: 255, g: 100, b: 180 };
    if (emotionLower.includes('excite') || emotionLower.includes('enthusiasm') || emotionLower.includes('thrill')) return { r: 255, g: 150, b: 0 };
    if (emotionLower.includes('optimism') || emotionLower.includes('hope')) return { r: 255, g: 220, b: 100 };
    if (emotionLower.includes('curiosity') || emotionLower.includes('curious') || emotionLower.includes('interest')) return { r: 100, g: 255, b: 150 };
    if (emotionLower.includes('surprise') || emotionLower.includes('amazed') || emotionLower.includes('awe')) return { r: 50, g: 220, b: 255 };
    if (emotionLower.includes('gratitude') || emotionLower.includes('thankful') || emotionLower.includes('appreciat')) return { r: 150, g: 255, b: 200 };
    if (emotionLower.includes('pride') || emotionLower.includes('confident') || emotionLower.includes('triumph')) return { r: 200, g: 150, b: 255 };
    if (emotionLower.includes('amusement') || emotionLower.includes('playful') || emotionLower.includes('fun')) return { r: 255, g: 180, b: 120 };
    if (emotionLower.includes('relief') || emotionLower.includes('comfort')) return { r: 150, g: 220, b: 255 };
    
    // negative emotions get cooler, more intense colors
    if (emotionLower.includes('anger') || emotionLower.includes('angry') || emotionLower.includes('rage') || emotionLower.includes('furious')) return { r: 255, g: 60, b: 60 };
    if (emotionLower.includes('sad') || emotionLower.includes('sorrow') || emotionLower.includes('grief') || emotionLower.includes('depress')) return { r: 100, g: 120, b: 255 };
    if (emotionLower.includes('fear') || emotionLower.includes('anxiety') || emotionLower.includes('worried') || emotionLower.includes('nervous')) return { r: 150, g: 100, b: 200 };
    if (emotionLower.includes('disgust') || emotionLower.includes('repulsion')) return { r: 150, g: 255, b: 100 };
    if (emotionLower.includes('frustrat') || emotionLower.includes('annoyed') || emotionLower.includes('irritat')) return { r: 255, g: 120, b: 80 };
    if (emotionLower.includes('disappoint') || emotionLower.includes('regret')) return { r: 120, g: 140, b: 200 };
    if (emotionLower.includes('envy') || emotionLower.includes('jealous')) return { r: 180, g: 200, b: 100 };
    if (emotionLower.includes('guilt') || emotionLower.includes('shame') || emotionLower.includes('embarrass')) return { r: 140, g: 120, b: 180 };
    if (emotionLower.includes('lonely') || emotionLower.includes('isolated')) return { r: 100, g: 100, b: 200 };
    if (emotionLower.includes('bitter') || emotionLower.includes('resentful')) return { r: 200, g: 100, b: 120 };
    
    // neutral and calm emotions
    if (emotionLower.includes('calm') || emotionLower.includes('peaceful') || emotionLower.includes('serene')) return { r: 120, g: 200, b: 220 };
    if (emotionLower.includes('contemplat') || emotionLower.includes('thoughtful') || emotionLower.includes('pensive')) return { r: 140, g: 160, b: 200 };
    if (emotionLower.includes('nostalgia') || emotionLower.includes('wistful')) return { r: 180, g: 150, b: 220 };
    if (emotionLower.includes('bored') || emotionLower.includes('indifferent') || emotionLower.includes('apathetic')) return { r: 110, g: 110, b: 115 };
    if (emotionLower.includes('confus') || emotionLower.includes('uncertain') || emotionLower.includes('perplex')) return { r: 160, g: 140, b: 180 };
    if (emotionLower.includes('neutral') || emotionLower.includes('balanced')) return { r: 130, g: 170, b: 210 };
    
    // fallback to sentiment-based coloring if no emotion match
    if (sentiment > 0.3) return { r: 120, g: 255, b: 150 };
    if (sentiment < -0.3) return { r: 255, g: 100, b: 120 };
    return { r: 120, g: 180, b: 255 };
  };

  // particle class - each particle follows the perlin noise flow field
  class Particle {
    constructor(p5) {
      this.p5 = p5;
      this.reset();
    }

    reset() {
      const centerX = this.p5.width / 2;
      const centerY = this.p5.height / 2;
      const domeWidth = this.p5.width * 0.3;
      const domeHeight = this.p5.height * 0.5;
      
      const angle = this.p5.random(this.p5.TWO_PI);
      const radiusRandom = Math.sqrt(this.p5.random());
      this.x = centerX + Math.cos(angle) * radiusRandom * domeWidth * 0.98;
      this.y = centerY + Math.sin(angle) * radiusRandom * domeHeight * 0.98;
      
      const velAngle = this.p5.random(this.p5.TWO_PI);
      const velMag = this.p5.random(2);
      this.vx = Math.cos(velAngle) * velMag;
      this.vy = Math.sin(velAngle) * velMag;
      
      this.size = this.p5.random(0.5, 2);
      this.alpha = this.p5.random(0.3, 0.6);
      this.history = [];
      this.maxHistory = 40;
      
      // each particle gets a unique noise offset so they don't all follow the same pattern
      this.noiseOffsetX = this.p5.random(10000);
      this.noiseOffsetY = this.p5.random(10000);
      this.noiseOffsetT = this.p5.random(10000);
    }

    update(time, energy, flowScale) {
      const centerX = this.p5.width / 2;
      const centerY = this.p5.height / 2;
      const domeWidth = this.p5.width * 0.3;
      const domeHeight = this.p5.height * 0.5;
      
      const dx = (this.x - centerX) / domeWidth;
      const dy = (this.y - centerY) / domeHeight;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      // sample perlin noise at particle's position with unique offset
      const noiseVal = this.p5.noise(
        (this.x + this.noiseOffsetX) * flowScale,
        (this.y + this.noiseOffsetY) * flowScale,
        (time + this.noiseOffsetT) * 0.001
      );
      const noiseAngle = noiseVal * this.p5.TWO_PI * 2;
      
      // set velocity based on noise direction and energy level
      const speed = 1.2 * energy;
      const randomAngle = this.p5.random(-0.5, 0.5);
      
      this.vx = Math.cos(noiseAngle + randomAngle) * speed;
      this.vy = Math.sin(noiseAngle + randomAngle) * speed;
      
      // respawn particle if it escapes the dome
      if (distFromCenter > 0.9) {
        this.reset();
        return;
      }

      // track position history for trails
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      this.x += this.vx;
      this.y += this.vy;
    }

    show(color) {
      // draw particle trail
      if (this.history.length > 1) {
        this.p5.stroke(color.r, color.g, color.b, this.alpha * 0.2 * 255);
        this.p5.strokeWeight(1);
        this.p5.noFill();
        this.p5.beginShape();
        for (let i = 0; i < this.history.length; i++) {
          this.p5.vertex(this.history[i].x, this.history[i].y);
        }
        this.p5.endShape();
      }

      // draw the particle itself
      this.p5.noStroke();
      this.p5.fill(color.r, color.g, color.b, this.alpha * 255);
      this.p5.circle(this.x, this.y, this.size * 2);
    }
  }

  const setup = (p5, canvasParentRef) => {
    const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
    canvas.parent(canvasParentRef);
    p5.colorMode(p5.RGB, 255);
    
    // create off-screen graphics for dome (using Canvas gradient)
    domeGraphicsRef.current = p5.createGraphics(p5.width, p5.height);
    
    const count = 2500;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(p5));
    }
  };

  const draw = (p5) => {
    const fadeAmount = isSpeaking ? 0.15 : 0.25;
    p5.background(0, 0, 0, fadeAmount * 255);
    
    // draw dome using native canvas gradient (keeps it smooth)
    const ctx = p5.drawingContext;
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const width = p5.width * 0.3;
    const height = p5.height * 0.5;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width);
    gradient.addColorStop(0, 'rgba(100, 100, 110, 0.4)');
    gradient.addColorStop(0.5, 'rgba(70, 70, 80, 0.25)');
    gradient.addColorStop(0.8, 'rgba(50, 50, 60, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const targetCount = isSpeaking ? 2500 : isRecording ? 2000 : 1500;
    const currentCount = particlesRef.current.length;
    
    if (currentCount < targetCount) {
      for (let i = 0; i < Math.min(50, targetCount - currentCount); i++) {
        particlesRef.current.push(new Particle(p5));
      }
    } else if (currentCount > targetCount) {
      particlesRef.current.splice(0, Math.min(50, currentCount - targetCount));
    }
    
    const color = getSentimentColor();
    const energy = getEnergyLevel();
    const flowScale = getFlowScale();
    
    particlesRef.current.forEach(particle => {
      particle.update(timeRef.current, energy, flowScale);
      particle.show(color);
    });
    
    timeRef.current += 1;
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <div className="aura-container">
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default AuraVisualization;
