// apiService.js - Centralized API communication service
// Place this file in: frontend/src/services/apiService.js

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`, config.body ? JSON.parse(config.body) : null);
      
      const response = await fetch(url, config);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`✅ API Response: ${response.status}`, data);

      if (!response.ok) {
        throw new ApiError(
          data.message || data.error || `HTTP error! status: ${response.status}`,
          response.status,
          data.code || 'API_ERROR',
          data
        );
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error: ${config.method || 'GET'} ${url}`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection.',
          0,
          'NETWORK_ERROR'
        );
      }

      throw new ApiError(
        error.message || 'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  // Chat API methods
  async initializeChat(userInfo = {}) {
    return this.request('/api/chat/init', {
      method: 'POST',
      body: JSON.stringify({ userInfo }),
    });
  }

  async sendMessage(sessionId, message) {
    if (!sessionId) {
      throw new ApiError('Session ID is required', 400, 'MISSING_SESSION_ID');
    }

    if (!message || message.trim().length === 0) {
      throw new ApiError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
    }

    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message: message.trim() }),
    });
  }

  async getChatHistory(sessionId) {
    if (!sessionId) {
      throw new ApiError('Session ID is required', 400, 'MISSING_SESSION_ID');
    }

    return this.request(`/api/chat/${sessionId}`);
  }

  async getCrisisResources() {
    return this.request('/api/chat/crisis/resources');
  }

  // Health check methods
  async healthCheck() {
    return this.request('/api/health');
  }

  async corsTest() {
    return this.request('/api/cors-test');
  }

  // Utility method to test connection
  async testConnection() {
    try {
      const health = await this.healthCheck();
      return {
        connected: true,
        status: health.status,
        services: health.services,
        message: 'Successfully connected to backend'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        code: error.code,
        message: 'Failed to connect to backend'
      };
    }
  }
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status = 0, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  // Check if error is retryable
  isRetryable() {
    return [429, 500, 502, 503, 504].includes(this.status);
  }

  // Check if error is a network issue
  isNetworkError() {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }

  // Check if error is a client error (4xx)
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  // Check if error is a server error (5xx)
  isServerError() {
    return this.status >= 500;
  }

  // Get user-friendly error message
  getUserMessage() {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'QUOTA_EXCEEDED':
        return 'Our AI service is currently at capacity. Please try again in a few minutes.';
      case 'RATE_LIMITED':
        return 'Please wait a moment before sending another message.';
      case 'SESSION_EXPIRED':
        return 'Your chat session has expired. Please start a new conversation.';
      case 'MESSAGE_TOO_LARGE':
        return 'Your message is too long. Please try a shorter message.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'CONFIG_ERROR':
      case 'AI_SERVICE_ERROR':
        return 'There\'s a temporary issue with our service. Please try again later.';
      default:
        return this.message || 'Something went wrong. Please try again.';
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiError };

// Export individual methods for convenience
export const {
  initializeChat,
  sendMessage,
  getChatHistory,
  getCrisisResources,
  healthCheck,
  corsTest,
  testConnection
} = apiService;