/**
 * Failsafe system for Twilio Voice AI Assistant
 * Prevents call drops and ensures responses within time limits
 */

const logger = require('./logger');

/**
 * Execute a function with a timeout
 * @param {Function} fn - Function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {any} fallbackValue - Value to return if timeout occurs
 * @returns {Promise<any>} Result of function or fallback value
 */
async function withTimeout(fn, timeout, fallbackValue) {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeout);
  });
  
  try {
    // Race between the function and the timeout
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    logger.logError('TIMEOUT_ERROR', error);
    return fallbackValue;
  }
}

/**
 * Get LLM response with timeout protection
 * @param {string} prompt - Prompt to send to LLM
 * @param {number} timeout - Timeout in milliseconds (default: 3000ms)
 * @returns {Promise<string>} LLM response or fallback
 */
async function getLlmResponseWithTimeout(prompt, timeout = 3000) {
  // This is a placeholder for the actual LLM call
  // In a real implementation, this would call Gemini or another LLM
  const llmCall = async () => {
    // Simulate LLM processing time (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }
    
    // TODO: Replace with actual Gemini API call
    return "I'd recommend trying our Blueberry Bagels. Unlike the Asiago Cheese Bagels you've been ordering, these are sweeter with a fruity flavor that pairs wonderfully with cream cheese. They're a customer favorite for breakfast meetings.";
  };
  
  const fallbackResponse = "I'd recommend trying this product based on your previous orders. It's a popular choice among our hotel customers.";
  
  return withTimeout(llmCall, timeout, fallbackResponse);
}

/**
 * Execute a critical operation with retry logic
 * @param {Function} operation - Function to execute
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<any>} Result of operation
 */
async function withRetry(operation, maxRetries = 2, retryDelay = 300) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.logError('RETRY_ATTEMPT', error, { attempt, maxRetries });
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Sanitize user input for LLM processing
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input) {
  if (!input) return '';
  
  // Enforce maximum input length
  const maxLength = 200;
  let sanitized = input.slice(0, maxLength);
  
  // Remove potential prompt injection attempts
  sanitized = sanitized
    // Basic prompt injection patterns
    .replace(/ignore previous instructions/gi, '[FILTERED]')
    .replace(/ignore all instructions/gi, '[FILTERED]')
    .replace(/system prompt/gi, '[FILTERED]')
    .replace(/as an AI/gi, '[FILTERED]')
    .replace(/you are a/gi, '[FILTERED]')
    // Additional injection patterns
    .replace(/reset the system/gi, '[FILTERED]')
    .replace(/delete all/gi, '[FILTERED]')
    .replace(/exploit|admin|token/gi, '[FILTERED]')
    .replace(/override|bypass|hack/gi, '[FILTERED]')
    .replace(/change (your|the) (role|behavior|instructions)/gi, '[FILTERED]')
    // Remove markdown and code blocks
    .replace(/```[\s\S]*?```/g, '[CODE REMOVED]')
    .replace(/\[.*?\]/g, '')
    .trim();
    
  return sanitized;
}

/**
 * Build a safe prompt for Gemini with guardrails
 * @param {string} userQuery - User query
 * @param {Object} productContext - Product context
 * @returns {string} Safe prompt
 */
function buildGeminiPrompt(userQuery, productContext) {
  const sanitizedQuery = sanitizeUserInput(userQuery);
  const { lastProduct, recommendedProduct } = productContext;
  
  return `
    You are a friendly voice assistant for hotel supply customers.
    
    RULES:
    - Only answer questions about food products
    - Keep responses under 3 sentences
    - Never mention anything outside the hotel supply context
    - If unsure, recommend the product but don't make up information
    - Be conversational and friendly, but concise
    
    PRODUCT CONTEXT:
    - Last purchased product: ${lastProduct || 'N/A'}
    - Recommended product: ${recommendedProduct || 'N/A'}
    
    USER QUERY: "${sanitizedQuery}"
    
    Your short, helpful response:
  `;
}

module.exports = {
  withTimeout,
  getLlmResponseWithTimeout,
  withRetry,
  sanitizeUserInput,
  buildGeminiPrompt
};
