# Plant Identifier

A web application that uses the Google Gemini AI API to identify plants from uploaded photos and provide detailed information about them.

## Features

- Upload plant images or take photos with your device camera
- AI-powered plant identification
- Detailed plant information including:
  - Common and scientific names
  - Plant description
  - Water and light requirements
  - Growth rate and mature size
  - Ideal climate
  - Key facts and care instructions

## Technologies Used

- Node.js & Express for the backend
- Vanilla JavaScript for the frontend
- Google Gemini Pro Vision API for plant identification
- Responsive design for mobile and desktop use

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Google Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/plant-identifier.git
   cd plant-identifier
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and go to `http://localhost:3000`

## Deployment

This application can be deployed to platforms like Heroku, Render, or Vercel. Make sure to set up the environment variables on your hosting platform.

## License

This project is licensed under the ISC License - see the LICENSE file for details.