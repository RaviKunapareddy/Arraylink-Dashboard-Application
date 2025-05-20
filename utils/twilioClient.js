/**
 * Twilio Client Wrapper with retry logic
 * Provides robust error handling and retry capabilities for Twilio API calls
 */

const twilio = require('twilio');
const logger = require('./logger');

// Create Twilio client
let client;
try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
  } else {
    console.error('Twilio credentials not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Twilio client:', error);
}

/**
 * Make a Twilio API call with retry logic
 * @param {Function} apiCall - Function that returns a Promise for a Twilio API call
 * @param {Object} options - Options for retry behavior
 * @returns {Promise<any>} Result of the API call
 */
async function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 2,
    initialDelay = 300,
    backoffFactor = 2,
    retryableErrors = [429, 500, 502, 503, 504]
  } = options;
  
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.logPerformance('TWILIO_RETRY_ATTEMPT', attempt, { delay });
      }
      
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Extract status code from various possible locations in Twilio error objects
      const statusCode = error?.status || error?.statusCode || error?.code || 
                       (error?.moreInfo && parseInt(error?.moreInfo?.match(/status=([0-9]+)/)?.[1])) || 
                       (error?.details?.response?.status);
      
      // Determine if the error is retryable
      const isRetryable = retryableErrors.includes(statusCode) ||
                          error.message?.includes('timeout') ||
                          error.message?.includes('connection') ||
                          error.message?.includes('network') ||
                          error.message?.includes('rate limit') ||
                          error.message?.includes('429');
      
      if (attempt < maxRetries && isRetryable) {
        logger.logError('TWILIO_RETRY', error, { 
          attempt, 
          maxRetries,
          delay,
          statusCode
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay *= backoffFactor;
      } else {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Create a Twilio call with retry logic
 * @param {Object} params - Parameters for Twilio calls.create
 * @returns {Promise<Object>} Twilio call object
 */
async function createCall(params) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }
  
  return withRetry(() => client.calls.create(params));
}

/**
 * Send a Twilio SMS with retry logic
 * @param {Object} params - Parameters for Twilio messages.create
 * @returns {Promise<Object>} Twilio message object
 */
async function sendSMS(params) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }
  
  return withRetry(() => client.messages.create(params));
}

/**
 * Fetch a Twilio call with retry logic
 * @param {string} callSid - Twilio Call SID
 * @returns {Promise<Object>} Twilio call object
 */
async function fetchCall(callSid) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }
  
  return withRetry(() => client.calls(callSid).fetch());
}

/**
 * Update a Twilio call with retry logic
 * @param {string} callSid - Twilio Call SID
 * @param {Object} params - Parameters to update
 * @returns {Promise<Object>} Updated Twilio call object
 */
async function updateCall(callSid, params) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }
  
  return withRetry(() => client.calls(callSid).update(params));
}

module.exports = {
  client,
  createCall,
  sendSMS,
  fetchCall,
  updateCall,
  withRetry
};
