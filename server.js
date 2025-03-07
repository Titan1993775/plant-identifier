const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Route to proxy Gemini API requests
app.post('/api/identify-plant', async (req, res) => {
  try {
    const imageData = req.body.imageData;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // The base64 data coming from the client will have a prefix like "data:image/jpeg;base64,"
    // We need to extract just the base64 part
    const base64Data = imageData.split(',')[1];
    
    // Forward request to Gemini API
    const response = await axios({
      method: 'post',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        contents: [{
          parts: [
            { text: 'Please identify this plant with high precision. Provide a detailed response in this specific format:\n\n' +
                  '1. Common Name: [plant name]\n' +
                  '2. Scientific Name: [scientific name]\n' +
                  '3. Description: [detailed description]\n' +
                  '4. Water Needs: [low/medium/high]\n' +
                  '5. Light Requirements: [full sun/partial shade/full shade]\n' +
                  '6. Growth Rate: [slow/medium/fast]\n' +
                  '7. Mature Size: [height and width]\n' +
                  '8. Ideal Climate: [tropical/temperate/etc]\n' +
                  '9. Key Facts: [3-5 short bullet points about unique features]\n' +
                  '10. Care Instructions: [detailed care instructions]\n\n' +
                  'Ensure each section is clearly labeled and informative.' },
            { 
              inline_data: { 
                mime_type: 'image/jpeg', 
                data: base64Data
              }
            }
          ]
        }],
        generation_config: {
          temperature: 0.4,
          max_output_tokens: 1000
        }
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error.message);
    
    // Send appropriate error response
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        error: `API Error (${error.response.status}): ${error.response.data?.error?.message || error.message}`
      });
    } else {
      return res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
});

// Serve index.html for all other routes (important for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});