# Plant Identifier

A web application that identifies plants from uploaded images or photos taken with your device camera. The app provides detailed information about the plant, including its scientific name, care instructions, and key facts.

## Features

- Upload images of plants for identification
- Take photos directly using your device camera
- Get detailed plant information:
  - Common and scientific names
  - Plant description
  - Water and light requirements
  - Growth rate and mature size
  - Ideal climate
  - Key facts and care instructions

## Technologies Used

- HTML, CSS, JavaScript
- Google Gemini API for plant identification
- Netlify Functions for secure API key management

## Setup Instructions

### Prerequisites

- GitHub account
- Netlify account (free)
- Google Gemini API key

### Deployment Steps

1. Fork this repository
2. Connect the repository to Netlify
3. Set up environment variables in Netlify:
   - `GEMINI_API_KEY`: Your Google Gemini API key
4. Deploy the site

## Local Development

If you want to run this project locally:

1. Clone the repository
2. Create a `.env` file with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Run a local server (e.g., using live-server)

## Privacy and Security

This application does not store any images or data. All processing is done in real-time using the Google Gemini API, and your API key is securely stored as an environment variable.

## License

MIT License