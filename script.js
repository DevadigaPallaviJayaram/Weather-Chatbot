/**
 * WeatherBot - Simple Weather Assistant
 * A modern weather chatbot application using only OpenWeatherMap API
 */

class WeatherBot {
    constructor() {
        console.log('🚀 Initializing WeatherBot...');
        
        // API configuration - Only OpenWeatherMap needed
        this.weatherApiKey = 'ae5135324a535d10ac54e229bb478122'; // Your OpenWeatherMap API key
        this.weatherBaseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        
        console.log('🔑 Weather API Key:', this.weatherApiKey ? 'SET' : 'NOT SET');
        
        // DOM elements
        this.chatMessages = document.getElementById('chatMessages');
        this.cityInput = document.getElementById('cityInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        console.log('🎯 DOM Elements:');
        console.log('   chatMessages:', this.chatMessages ? 'FOUND' : 'NOT FOUND');
        console.log('   cityInput:', this.cityInput ? 'FOUND' : 'NOT FOUND');
        console.log('   sendBtn:', this.sendBtn ? 'FOUND' : 'NOT FOUND');
        
        // Initialize the application
        this.initializeEventListeners();
        this.focusInput();
        
        console.log('✅ WeatherBot initialized successfully!');
    }

    /**
     * Set up event listeners for user interactions
     */
    initializeEventListeners() {
        // Send button click handler
        this.sendBtn.addEventListener('click', () => this.handleUserMessage());
        
        // Enter key press handler
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });
        
        // Input field change handler
        this.cityInput.addEventListener('input', () => {
            this.sendBtn.disabled = this.cityInput.value.trim() === '';
        });

        // Focus input on page load
        this.cityInput.addEventListener('blur', () => {
            setTimeout(() => this.focusInput(), 100);
        });
    }

    /**
     * Focus on the input field
     */
    focusInput() {
        this.cityInput.focus();
    }

    /**
     * Handle user message submission
     */
    async handleUserMessage() {
        console.log('🔄 Starting handleUserMessage...');
        const userMessage = this.cityInput.value.trim();
        console.log('📝 User message:', userMessage);
        
        // Validate input
        if (!userMessage) {
            console.log('❌ Empty message, returning');
            return;
        }
        
        // Add user message to chat
        this.addMessage(userMessage, 'user');
        
        // Clear input and disable send button
        this.cityInput.value = '';
        this.sendBtn.disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            console.log('🔍 Extracting city from message...');
            // Extract city name from user message
            const cityName = this.extractCityFromMessage(userMessage);
            console.log('🏙️ Extracted city:', cityName);
            
            if (cityName) {
                console.log('🌤️ Fetching weather data for:', cityName);
                // Get weather data
                const weatherData = await this.fetchWeatherData(cityName);
                console.log('📊 Weather data received:', weatherData);
                
                // Remove typing indicator and show responses
                this.removeTypingIndicator();
                this.addMessage(this.generateWeatherResponse(weatherData), 'bot');
                this.addWeatherMessage(weatherData);
            } else {
                // Handle when no city is found
                this.removeTypingIndicator();
                this.addMessage("I'd be happy to help you with weather information! Please mention a city name in your message. For example: 'weather in London' or 'how's the weather in Tokyo?'", 'bot');
            }
            
        } catch (error) {
            console.error('❌ Error in handleUserMessage:', error);
            // Handle errors
            this.removeTypingIndicator();
            this.addMessage(this.getErrorMessage(error), 'bot', true);
        }
        
        // Re-enable send button and focus input
        this.sendBtn.disabled = false;
        this.focusInput();
        console.log('✅ handleUserMessage completed');
    }

    /**
     * Extract city name from user message using simple pattern matching
     * @param {string} message - User message
     * @returns {string|null} Extracted city name or null
     */
    extractCityFromMessage(message) {
        console.log('🔍 Extracting city from:', message);
        
        // Convert to lowercase for easier matching
        const lowerMessage = message.toLowerCase();
        
        // Weather-related keywords that indicate a weather query
        const weatherKeywords = ['weather', 'temperature', 'temp', 'forecast', 'climate', 'rain', 'sunny', 'cloudy', 'snow', 'hot', 'cold', 'warm', 'cool'];
        
        // Check if the message contains weather-related keywords
        const hasWeatherKeyword = weatherKeywords.some(keyword => 
            lowerMessage.includes(keyword)
        );
        
        console.log('🔍 Has weather keyword:', hasWeatherKeyword);
        
        if (!hasWeatherKeyword) {
            // If no weather keywords, check if it's just a city name
            const words = message.trim().split(/\s+/);
            if (words.length <= 3) {
                // If it's 1-3 words, assume it might be a city name
                const possibleCity = words.join(' ');
                console.log('🏙️ Assuming city name:', possibleCity);
                return possibleCity;
            }
            return null;
        }
        
        // Common patterns to extract city names
        const patterns = [
            /(?:weather|temperature|temp|forecast|climate|rain|sunny|cloudy|snow|hot|cold|warm|cool)\s+(?:in|at|for|of)\s+([a-zA-Z\s,]+)/i,
            /(?:in|at|for|of)\s+([a-zA-Z\s,]+)\s+(?:weather|temperature|temp|forecast|climate|rain|sunny|cloudy|snow|hot|cold|warm|cool)/i,
            /([a-zA-Z\s,]+)\s+(?:weather|temperature|temp|forecast|climate)/i,
            /(?:how(?:'s| is))\s+(?:the\s+)?(?:weather|temperature|temp|forecast|climate)\s+(?:in|at|for|of)\s+([a-zA-Z\s,]+)/i
        ];
        
        // Try each pattern
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                let city = match[1].trim();
                // Clean up the city name
                city = city.replace(/\b(today|tomorrow|now|currently|right now|this morning|tonight)\b/gi, '').trim();
                city = city.replace(/[?.!,]+$/, '').trim(); // Remove trailing punctuation
                
                if (city.length > 1) {
                    console.log('🏙️ Pattern matched city:', city);
                    return city;
                }
            }
        }
        
        // If no pattern matches, look for capitalized words (potential city names)
        const words = message.split(/\s+/);
        const capitalizedWords = words.filter(word => 
            word.length > 2 && 
            word[0] === word[0].toUpperCase() &&
            !weatherKeywords.includes(word.toLowerCase()) &&
            !['I', 'Is', 'It', 'The', 'What', 'How', 'Where', 'When', 'Why', 'Today', 'Tomorrow'].includes(word)
        );
        
        if (capitalizedWords.length > 0) {
            const possibleCity = capitalizedWords.join(' ');
            console.log('🏙️ Capitalized words found:', possibleCity);
            return possibleCity;
        }
        
        console.log('🏙️ No city found');
        return null;
    }

    /**
     * Generate a friendly response about the weather
     * @param {Object} weatherData - Weather data from API
     * @returns {string} Friendly weather response
     */
    generateWeatherResponse(weatherData) {
        const temp = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const condition = weatherData.weather[0].description;
        const city = weatherData.name;
        const country = weatherData.sys.country;
        
        let response = `Here's the current weather in ${city}, ${country}! `;
        
        // Add temperature context
        if (temp < 0) {
            response += `It's quite cold at ${temp}°C with ${condition}. ❄️ Bundle up warm!`;
        } else if (temp < 10) {
            response += `It's chilly at ${temp}°C with ${condition}. 🧥 You'll want a jacket!`;
        } else if (temp < 20) {
            response += `It's cool at ${temp}°C with ${condition}. 👕 Perfect weather for a light jacket!`;
        } else if (temp < 30) {
            response += `It's pleasant at ${temp}°C with ${condition}. ☀️ Great weather to be outside!`;
        } else {
            response += `It's quite warm at ${temp}°C with ${condition}. 🌡️ Stay hydrated and find some shade!`;
        }
        
        // Add feels like temperature if significantly different
        if (Math.abs(temp - feelsLike) > 3) {
            response += ` Though it feels like ${feelsLike}°C.`;
        }
        
        // Add condition-specific advice
        if (condition.includes('rain') || condition.includes('drizzle')) {
            response += ` Don't forget your umbrella! ☔`;
        } else if (condition.includes('snow')) {
            response += ` Watch out for slippery roads! ⛄`;
        } else if (condition.includes('clear') && temp > 25) {
            response += ` Perfect weather for outdoor activities! 🌞`;
        }
        
        return response;
    }

    /**
     * Fetch weather data from OpenWeatherMap API
     * @param {string} city - City name to search for
     * @returns {Promise<Object>} Weather data
     */
    async fetchWeatherData(city) {
        // Check if API key is set
        if (this.weatherApiKey === 'YOUR_WEATHER_API_KEY_HERE') {
            throw new Error('WEATHER_API_KEY_NOT_SET');
        }

        // Build API URL
        const url = `${this.weatherBaseUrl}?q=${encodeURIComponent(city)}&appid=${this.weatherApiKey}&units=metric`;
        console.log('🌐 API URL:', url.replace(this.weatherApiKey, 'API_KEY_HIDDEN'));
        
        try {
            // Make API request
            const response = await fetch(url);
            console.log('📡 API response status:', response.status);

            // Handle different error status codes
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('CITY_NOT_FOUND');
                } else if (response.status === 401) {
                    throw new Error('INVALID_WEATHER_API_KEY');
                } else if (response.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                } else {
                    throw new Error('WEATHER_API_ERROR');
                }
            }

            // Parse and return JSON response
            const data = await response.json();
            console.log('📊 Weather data:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Fetch error:', error);
            // Handle network errors
            if (error.name === 'TypeError') {
                throw new Error('NETWORK_ERROR');
            }
            throw error;
        }
    }

    /**
     * Add a text message to the chat
     * @param {string} content - Message content
     * @param {string} sender - Message sender ('user' or 'bot')
     * @param {boolean} isError - Whether this is an error message
     */
    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `message-bubble ${isError ? 'error-message' : ''}`;
        bubbleDiv.textContent = content;
        
        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Add a weather card message to the chat
     * @param {Object} data - Weather data from API
     */
    addWeatherMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const weatherCard = this.createWeatherCard(data);
        messageDiv.appendChild(weatherCard);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Create a weather card element
     * @param {Object} data - Weather data from API
     * @returns {HTMLElement} Weather card element
     */
    createWeatherCard(data) {
        const card = document.createElement('div');
        card.className = 'weather-card';
        
        // Extract weather data
        const weatherIcon = this.getWeatherIcon(data.weather[0].main.toLowerCase());
        const temperature = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
        const pressure = data.main.pressure;
        const description = data.weather[0].description;
        const cityName = data.name;
        const country = data.sys.country;

        // Create weather card HTML
        card.innerHTML = `
            <h3>${cityName}, ${country}</h3>
            <div class="weather-main">
                <div class="weather-icon">${weatherIcon}</div>
                <div class="temperature">${temperature}°C</div>
            </div>
            <p style="font-size: 1.1rem; margin-bottom: 15px; text-transform: capitalize;">
                ${description}
            </p>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="detail-label">Feels like</div>
                    <div class="detail-value">${feelsLike}°C</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${windSpeed} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Pressure</div>
                    <div class="detail-value">${pressure} hPa</div>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Get weather icon emoji based on condition
     * @param {string} condition - Weather condition
     * @returns {string} Weather icon emoji
     */
    getWeatherIcon(condition) {
        const icons = {
            'clear': '☀️',
            'clouds': '☁️',
            'rain': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️',
            'fog': '🌫️',
            'haze': '🌫️',
            'smoke': '🌫️',
            'dust': '🌪️',
            'sand': '🌪️',
            'ash': '🌋',
            'squall': '💨',
            'tornado': '🌪️'
        };
        return icons[condition] || '🌤️';
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typing-indicator';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble typing-indicator';
        bubbleDiv.innerHTML = `
            WeatherBot is typing...
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        typingDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'WEATHER_API_KEY_NOT_SET': '⚠️ Please set your OpenWeatherMap API key in the code to use weather features.',
            'CITY_NOT_FOUND': '🤔 Sorry, I couldn\'t find that city. Please check the spelling and try again.',
            'INVALID_WEATHER_API_KEY': '🔑 Invalid weather API key. Please check your OpenWeatherMap API key.',
            'RATE_LIMIT_EXCEEDED': '⏰ Too many requests. Please wait a moment and try again.',
            'NETWORK_ERROR': '🌐 Network connection error. Please check your internet connection.',
            'WEATHER_API_ERROR': '🔧 There was an issue connecting to the weather service. Please try again later.'
        };

        return errorMessages[error.message] || '❌ Something went wrong. Please try again.';
    }

    /**
     * Scroll chat messages to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
}

/**
 * Utility functions for weather data processing
 */
const WeatherUtils = {
    /**
     * Format timestamp to readable time
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted time
     */
    formatTime(timestamp) {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Convert wind direction degrees to compass direction
     * @param {number} degrees - Wind direction in degrees
     * @returns {string} Compass direction
     */
    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return directions[Math.round(degrees / 22.5) % 16];
    },

    /**
     * Get UV index description
     * @param {number} uv - UV index
     * @returns {string} UV description
     */
    getUVDescription(uv) {
        if (uv <= 2) return 'Low';
        if (uv <= 5) return 'Moderate';
        if (uv <= 7) return 'High';
        if (uv <= 10) return 'Very High';
        return 'Extreme';
    }
};

/**
 * Initialize the weather bot when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing WeatherBot...');
    
    // Create new WeatherBot instance
    const weatherBot = new WeatherBot();
    
    // Add some helpful keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus input field when typing (except when already focused)
        if (e.target !== weatherBot.cityInput && 
            !e.ctrlKey && !e.altKey && !e.metaKey &&
            e.key.length === 1) {
            weatherBot.cityInput.focus();
        }
        
        // Escape key to clear input
        if (e.key === 'Escape') {
            weatherBot.cityInput.value = '';
            weatherBot.cityInput.focus();
        }
    });
    
    // Prevent form submission if wrapped in a form
    const form = weatherBot.cityInput.closest('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            weatherBot.handleUserMessage();
        });
    }
    
    console.log('🌤️ WeatherBot ready to use!');
    console.log('💡 Try typing: "weather in London" or just "Tokyo"');
});