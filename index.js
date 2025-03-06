// This file will be deployed as a Netlify Function to securely provide the API key
exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }
  
    // Return the API key from environment variable
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow requests only from your GitHub Pages domain
        'Access-Control-Allow-Origin': 'https://yourusername.github.io',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        apiKey: process.env.GEMINI_API_KEY
      })
    };
  };