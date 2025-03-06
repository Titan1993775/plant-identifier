// This file will fetch the API key from a secure gist
const CONFIG = {
    // The API key will be populated at runtime
    GEMINI_API_KEY: null,
    
    // Initialize the config
    async init() {
        try {
            // Try to get the API key from local storage first (if previously saved)
            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey) {
                this.GEMINI_API_KEY = storedKey;
                return true;
            }
            
            // Fetch the API key from the gist
            const success = await this.fetchApiKeyFromGist();
            if (success) {
                return true;
            }
            
            // If gist fetch fails, show API key entry modal as fallback
            const apiKey = await this.promptForApiKey();
            if (apiKey) {
                this.GEMINI_API_KEY = apiKey;
                // Save to local storage for future visits
                localStorage.setItem('gemini_api_key', apiKey);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to initialize API key:', error);
            return false;
        }
    },

    // Function to fetch API key from gist
    async fetchApiKeyFromGist() {
        try {
            // Replace 'YOUR_GIST_URL' with your actual gist URL
            // For example: 'https://gist.github.com/Titan1993775/532b4ef150624e01c54fee998a77820a'
            const gistUrl = 'https://gist.github.com/Titan1993775/532b4ef150624e01c54fee998a77820a/raw/45765169eaae095053b0e73387c9bf05625de063/api-key.txt';
            
            const response = await fetch(gistUrl);
            
            if (!response.ok) {
                console.error('Failed to fetch from gist:', response.statusText);
                return false;
            }
            
            // The gist should contain just the API key as plain text
            const apiKey = await response.text();
            
            if (apiKey && apiKey.trim().length > 0) {
                this.GEMINI_API_KEY = apiKey.trim();
                // Save to local storage for future visits
                localStorage.setItem('gemini_api_key', apiKey.trim());
                return true;
            } else {
                console.error('Retrieved empty API key from gist');
                return false;
            }
        } catch (error) {
            console.error('Error fetching API key from gist:', error);
            return false;
        }
    },

    // Function to prompt user for API key (fallback method)
    promptForApiKey() {
        return new Promise((resolve) => {
            // Create modal elements
            const modal = document.createElement('div');
            modal.className = 'api-key-modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'api-key-modal-content';
            
            const heading = document.createElement('h2');
            heading.textContent = 'Enter Google Gemini API Key';
            
            const description = document.createElement('p');
            description.innerHTML = 'To use this Plant Identifier, you need a Google Gemini API key.<br>Get a free key at <a href="https://ai.google.dev/" target="_blank">ai.google.dev</a>';
            
            const form = document.createElement('form');
            form.className = 'api-key-form';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Paste your API key here';
            input.className = 'api-key-input';
            
            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'api-key-submit';
            submitBtn.textContent = 'Save API Key';
            
            // Assemble the modal
            form.appendChild(input);
            form.appendChild(submitBtn);
            
            modalContent.appendChild(heading);
            modalContent.appendChild(description);
            modalContent.appendChild(form);
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Style the modal
            // This adds styles directly if the user hasn't added them to styles.css
            if (!document.querySelector('style#apiKeyModalStyles')) {
                const style = document.createElement('style');
                style.id = 'apiKeyModalStyles';
                style.textContent = `
                    .api-key-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    .api-key-modal-content {
                        background-color: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        width: 90%;
                        max-width: 500px;
                    }
                    .api-key-form {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .api-key-input {
                        padding: 12px 15px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }
                    .api-key-submit {
                        padding: 12px 15px;
                        background-color: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    .api-key-submit:hover {
                        background-color: #388E3C;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Form submission handler
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const apiKey = input.value.trim();
                
                if (!apiKey) {
                    alert("Please enter a valid API key");
                    return;
                }
                
                // Close the modal
                document.body.removeChild(modal);
                
                // Return the API key
                resolve(apiKey);
            });
            
            // Focus the input field
            setTimeout(() => input.focus(), 100);
        });
    },

    // Function to clear API key and prompt for a new one
    clearAndResetApiKey() {
        localStorage.removeItem('gemini_api_key');
        this.GEMINI_API_KEY = null;
        return this.init();
    }
};