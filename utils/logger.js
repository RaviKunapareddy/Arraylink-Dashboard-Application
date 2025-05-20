/**
 * Logger for Twilio Voice AI Assistant
 * Provides detailed logging for debugging and performance monitoring
 */

/**
 * Log Twilio interaction with detailed request data
 * @param {Object} req - Express request object
 * @param {string} stage - Stage of the interaction (e.g., 'INITIAL_CALL', 'USER_RESPONSE')
 * @param {Object} details - Additional details to log
 */
function logTwilioInteraction(req, stage, details = {}) {
  const timestamp = new Date().toISOString();
  const callSid = req.body?.CallSid || 'unknown';
  
  console.log(`[${timestamp}] [${stage}] CallSID: ${callSid}`);
  
  // Log Twilio request data
  if (req.body) {
    const payload = {
      CallSid: req.body.CallSid,
      From: req.body.From,
      To: req.body.To,
      CallStatus: req.body.CallStatus,
      SpeechResult: req.body.SpeechResult,
      Confidence: req.body.Confidence,
      Digits: req.body.Digits
    };
    
    console.log("Twilio payload:", JSON.stringify(payload, null, 2));
    
    // Log full payload in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Full Twilio payload:", JSON.stringify(req.body, null, 2));
    }
  }
  
  // Log intent detection results
  if (details.intent) {
    console.log(`Intent detected: ${details.intent.intent} (confidence: ${details.intent.confidence})`);
    console.log(`Matched phrase: "${details.intent.matchedPhrase}"`);
  }
  
  // Log multiple intents if available
  if (details.intents && Array.isArray(details.intents)) {
    console.log(`Multiple intents detected: ${details.intents.length}`);
    details.intents.forEach((intent, index) => {
      console.log(`  ${index + 1}. ${intent.intent} (confidence: ${intent.confidence})`);
    });
  }
  
  // Log LLM details
  if (details.llmQuery) {
    console.log(`LLM Query: "${details.llmQuery}"`);
    console.log(`LLM Response time: ${details.llmResponseTime}ms`);
    console.log(`LLM Response: "${details.llmResponse}"`);
  }
  
  // Log session data if available
  if (details.session) {
    const sessionSummary = {
      callSid: details.session.callSid,
      startTime: new Date(details.session.startTime).toISOString(),
      lastIntent: details.session.lastIntent,
      lastPromptType: details.session.lastPromptType,
      speechHistoryCount: details.session.speechHistory?.length || 0
    };
    
    console.log("Session summary:", JSON.stringify(sessionSummary, null, 2));
  }
  
  // Log any additional details
  if (Object.keys(details).length > 0) {
    const filteredDetails = { ...details };
    // Remove already logged properties to avoid duplication
    delete filteredDetails.intent;
    delete filteredDetails.intents;
    delete filteredDetails.llmQuery;
    delete filteredDetails.llmResponse;
    delete filteredDetails.llmResponseTime;
    delete filteredDetails.session;
    
    if (Object.keys(filteredDetails).length > 0) {
      console.log("Additional details:", JSON.stringify(filteredDetails, null, 2));
    }
  }
  
  console.log("-----------------------------------");
}

/**
 * Log error with context
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(errorType, error, context = {}) {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] [ERROR] [${errorType}]`);
  console.error(`Message: ${error.message}`);
  
  if (error.stack) {
    console.error(`Stack: ${error.stack}`);
  }
  
  if (Object.keys(context).length > 0) {
    console.error("Error context:", JSON.stringify(context, null, 2));
  }
  
  console.error("-----------------------------------");
}

/**
 * Log performance metrics
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {Object} context - Additional context
 */
function logPerformance(metricName, value, context = {}) {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [PERFORMANCE] [${metricName}]: ${value}`);
  
  if (Object.keys(context).length > 0) {
    console.log("Performance context:", JSON.stringify(context, null, 2));
  }
}

module.exports = {
  logTwilioInteraction,
  logError,
  logPerformance
};
