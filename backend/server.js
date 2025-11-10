require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// simple health check to verify server is running
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// endpoint to process text and get sentiment analysis
app.post('/process_text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // send text to Groq API
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the given text and return ONLY a JSON object with: sentiment (number between -1 and 1, where -1 is very negative, 0 is neutral, 1 is very positive), sentimentLabel (string: positive/negative/neutral), keywords (array of 3-5 relevant words), and emotion (string describing the primary emotion). Return ONLY valid JSON, no extra text.'
          },
          {
            role: 'user',
            content: `Analyze this text: "${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = groqResponse.data.choices[0].message.content;
    
    // sometimes the AI wraps response in markdown, so we need to extract the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(aiMessage);
    } catch (parseError) {
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    res.json(parsedData);

  } catch (error) {
    console.error('Error processing text:', error.response?.data || error.message);
    
    // if the API call fails, send back neutral sentiment so the app keeps working
    res.status(500).json({
      error: 'Failed to process text',
      message: error.message,
      fallback: true,
      sentiment: 0,
      sentimentLabel: 'neutral',
      keywords: [],
      emotion: 'neutral'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});

// export for serverless deployment
module.exports = app;
