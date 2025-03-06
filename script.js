// DOM Element References
const imageUpload = document.getElementById('imageUpload');
const imageContainer = document.getElementById('imageContainer');
const imageOverlay = document.getElementById('imageOverlay');
const previewImage = document.getElementById('previewImage');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const plantName = document.getElementById('plantName');
const scientificName = document.getElementById('scientificName');
const description = document.getElementById('description');
const careInstructions = document.getElementById('careInstructions');
const keyFacts = document.getElementById('keyFacts');

// Camera elements
const cameraBtn = document.getElementById('cameraBtn');
const cameraInterface = document.getElementById('cameraInterface');
const cameraStream = document.getElementById('cameraStream');
const captureBtn = document.getElementById('captureBtn');
const cancelCameraBtn = document.getElementById('cancelCameraBtn');
const canvas = document.getElementById('canvas');

// Table cell references
const waterNeeds = document.getElementById('waterNeeds');
const lightRequirements = document.getElementById('lightRequirements');
const growthRate = document.getElementById('growthRate');
const matureSize = document.getElementById('matureSize');
const idealClimate = document.getElementById('idealClimate');

// Camera stream global variable
let stream = null;

// Check if camera is supported
const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Initialize the application
async function initApp() {
    try {
        // Show loading state while fetching API key
        const apiKeyLoading = document.createElement('div');
        apiKeyLoading.className = 'loading-container';
        apiKeyLoading.innerHTML = '<div class="spinner"></div><p>Loading application...</p>';
        document.querySelector('.container').prepend(apiKeyLoading);
        
        // Initialize the configuration to get the API key
        const success = await CONFIG.init();
        
        // Remove loading state
        apiKeyLoading.remove();
        
        if (!success) {
            displayErrorMessage('Failed to initialize the application. Please try again later.');
        }
    } catch (error) {
        console.error('Application initialization failed:', error);
        displayErrorMessage('Application initialization failed. Please try again later.');
    }
}

// Image Upload Event Listener
imageUpload.addEventListener('change', function(event) {
    resetDisplay();
    stopCamera(); // Ensure camera is stopped if it was active
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.match('image.*')) {
        displayErrorMessage('Please upload an image file (JPEG, PNG, etc.)');
        return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        displayErrorMessage('Image too large. Please upload an image smaller than 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        imageContainer.style.display = 'block';
        
        // Start identification with slight delay to allow UI to update
        setTimeout(() => identifyPlant(e.target.result), 300);
    };
    
    reader.onerror = function() {
        displayErrorMessage('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
});

// Camera Button Event Listener
cameraBtn.addEventListener('click', async function() {
    resetDisplay();
    
    if (!isCameraSupported()) {
        displayErrorMessage('Camera is not supported on your device or browser.');
        return;
    }
    
    try {
        // Hide image container if visible
        imageContainer.style.display = 'none';
        
        // Get camera stream
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Use back camera if available
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        // Show camera interface
        cameraInterface.style.display = 'block';
        
        // Connect stream to video element
        cameraStream.srcObject = stream;
    } catch (error) {
        console.error('Camera access error:', error);
        
        if (error.name === 'NotAllowedError') {
            displayErrorMessage('Camera access denied. Please allow camera access to use this feature.');
        } else {
            displayErrorMessage('Camera error: ' + error.message);
        }
    }
});

// Capture Button Event Listener
captureBtn.addEventListener('click', function() {
    if (!stream) return;
    
    try {
        // Set canvas dimensions to match video
        const videoWidth = cameraStream.videoWidth;
        const videoHeight = cameraStream.videoHeight;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        context.drawImage(cameraStream, 0, 0, videoWidth, videoHeight);
        
        // Convert canvas to data URL (image)
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Display captured image and hide camera
        previewImage.src = imageData;
        imageContainer.style.display = 'block';
        cameraInterface.style.display = 'none';
        
        // Stop camera stream
        stopCamera();
        
        // Start plant identification
        setTimeout(() => identifyPlant(imageData), 300);
    } catch (error) {
        console.error('Error capturing image:', error);
        displayErrorMessage('Failed to capture image. Please try again.');
    }
});

// Cancel Camera Button Event Listener
cancelCameraBtn.addEventListener('click', function() {
    stopCamera();
    cameraInterface.style.display = 'none';
});

// Stop camera stream function
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    if (cameraStream.srcObject) {
        cameraStream.srcObject = null;
    }
}

// Reset all display elements
function resetDisplay() {
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    loadingIndicator.style.display = 'none';
    cameraInterface.style.display = 'none';
    keyFacts.innerHTML = '';
}

// Plant Identification Function with improved error handling and timeout
async function identifyPlant(imageData) {
    // Check if API key is available
    if (!CONFIG.GEMINI_API_KEY) {
        displayErrorMessage('API key not available. Please refresh the page or try again later.');
        return;
    }
    
    loadingIndicator.style.display = 'block';
    imageOverlay.textContent = 'Analyzing this plant...';
    
    // Set a timeout to abort if API takes too long
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000)
    );
    
    try {
        // Race the API request against the timeout
        const result = await Promise.race([
            fetchPlantData(imageData),
            timeoutPromise
        ]);
        
        displayPlantInfo(result);
    } catch (error) {
        console.error('Plant identification error:', error);
        displayErrorMessage(error.message || 'Failed to identify plant. Please try again.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Separate API fetch function for better organization
async function fetchPlantData(imageData) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
                        { inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: imageData.split(',')[1] 
                        }}
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,  // Lower temperature for more accurate results
                    maxOutputTokens: 1000
                }
            })
        });

        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(`API Error (${response.status}): ${errorData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Enhanced error checking
        if (!data.candidates || !data.candidates.length) {
            throw new Error('No results received from AI model');
        }

        // Extract plant information from the response
        const plantInfo = data.candidates[0]?.content?.parts[0]?.text;
        
        if (!plantInfo) {
            throw new Error('No plant information found in the response');
        }
        
        return plantInfo;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Improved display function with better parsing
function displayPlantInfo(info) {
    // Parse information using regular expressions for more robust extraction
    const commonNameMatch = info.match(/Common Name:\s*(.+?)(?=\n|$)/i);
    const scientificNameMatch = info.match(/Scientific Name:\s*(.+?)(?=\n|$)/i);
    const descriptionMatch = info.match(/Description:\s*(.+?)(?=\n\d+\.|$)/is);
    const waterNeedsMatch = info.match(/Water Needs:\s*(.+?)(?=\n|$)/i);
    const lightRequirementsMatch = info.match(/Light Requirements:\s*(.+?)(?=\n|$)/i);
    const growthRateMatch = info.match(/Growth Rate:\s*(.+?)(?=\n|$)/i);
    const matureSizeMatch = info.match(/Mature Size:\s*(.+?)(?=\n|$)/i);
    const idealClimateMatch = info.match(/Ideal Climate:\s*(.+?)(?=\n|$)/i);
    const keyFactsMatch = info.match(/Key Facts:\s*(.+?)(?=\n\d+\.|$)/is);
    const careInstructionsMatch = info.match(/Care Instructions:\s*(.+?)(?=\n\d+\.|$)/is);
    
    // Set values or default text
    plantName.textContent = commonNameMatch ? commonNameMatch[1].trim() : 'Unknown Plant';
    scientificName.textContent = scientificNameMatch ? scientificNameMatch[1].trim() : '';
    description.textContent = descriptionMatch ? descriptionMatch[1].trim() : 'No description available';
    waterNeeds.textContent = waterNeedsMatch ? waterNeedsMatch[1].trim() : '-';
    lightRequirements.textContent = lightRequirementsMatch ? lightRequirementsMatch[1].trim() : '-';
    growthRate.textContent = growthRateMatch ? growthRateMatch[1].trim() : '-';
    matureSize.textContent = matureSizeMatch ? matureSizeMatch[1].trim() : '-';
    idealClimate.textContent = idealClimateMatch ? idealClimateMatch[1].trim() : '-';
    careInstructions.textContent = careInstructionsMatch ? careInstructionsMatch[1].trim() : 'No care instructions found';
    
    // Clear previous key facts
    keyFacts.innerHTML = '';
    
    // Process key facts if available
    if (keyFactsMatch && keyFactsMatch[1]) {
        // Look for bullet points, asterisks, numbers, or dashes followed by text
        const factsText = keyFactsMatch[1].trim();
        const factsList = factsText.split(/\n/).map(line => line.trim());
        
        // Clean up bullet points and format facts
        factsList.forEach(fact => {
            // Remove bullet points, asterisks, dashes, etc.
            const cleanedFact = fact.replace(/^[\s•\*\-\d\.]+/, '').trim();
            
            if (cleanedFact) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = cleanedFact;
                keyFacts.appendChild(badge);
            }
        });
        
        // If no facts were found with the above pattern, try a simpler approach
        if (keyFacts.children.length === 0) {
            createSimpleFacts(factsText);
        }
    } else {
        // Add a default fact about identification
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'Identified with AI technology';
        keyFacts.appendChild(badge);
    }
    
    // Show the results section with animation
    resultSection.style.display = 'block';
    
    // Update overlay text
    imageOverlay.textContent = 'Plant Identified!';
}

// Create simple facts when regular bullet points aren't detected
function createSimpleFacts(factsText) {
    // Split by sentences or commas if we couldn't find bullet points
    const facts = factsText.split(/[.,;]/).filter(f => f.trim().length > 5);
    
    facts.slice(0, 4).forEach(fact => {
        if (fact.trim()) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = fact.trim();
            keyFacts.appendChild(badge);
        }
    });
}

function displayErrorMessage(message) {
    loadingIndicator.style.display = 'none';
    errorSection.style.display = 'block';
    document.getElementById('errorMessage').textContent = 
        `Error: ${message}. Please try again or check your image.`;
}

// Check for camera support when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!isCameraSupported()) {
        cameraBtn.style.display = 'none';
    }
    
    // Initialize the application to get API key
    initApp();
});

// Handle page visibility changes to properly stop camera when user leaves page
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        stopCamera();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopCamera();
});