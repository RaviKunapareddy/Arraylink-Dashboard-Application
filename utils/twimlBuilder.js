/**
 * TwiML Builder for Twilio Voice AI Assistant
 * Generates properly formatted TwiML responses
 * 
 * IMPORTANT: Several functions in this module directly mutate the session object.
 * This is intentional for the in-memory implementation, but should be refactored
 * when switching to a distributed session store like Redis.
 * 
 * Functions that mutate session:
 * - buildInitialPrompt()
 * - buildIntentResponse()
 * - buildLlmResponse()
 * - buildContextAwareFallback()
 */

/**
 * Escape XML special characters to prevent injection
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a clean TwiML response with proper XML formatting
 * @param {string} innerXml - TwiML content inside the <Response> tags
 * @returns {string} Complete TwiML document
 */
function buildTwiml(innerXml) {
  // Ensure the XML declaration is the very first character with no whitespace
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Response>' +
    innerXml +
    '</Response>';
}

/**
 * Validates TwiML to ensure it's properly formatted
 * @param {string} twiml - TwiML string to validate
 * @returns {Object} Validation result with isValid flag and error message if invalid
 */
function validateTwiml(twiml) {
  if (!twiml) {
    return { isValid: false, error: 'TwiML is empty' };
  }
  
  // Check for XML declaration
  if (!twiml.startsWith('<?xml')) {
    return { isValid: false, error: 'Missing XML declaration' };
  }
  
  // Check for Response tag
  if (!twiml.includes('<Response>') || !twiml.includes('</Response>')) {
    return { isValid: false, error: 'Missing Response tags' };
  }
  
  // Check for balanced tags (simple check)
  const openTags = [];
  const tagPattern = /<\/?([a-zA-Z]+)[^>]*>/g;
  let match;
  
  while ((match = tagPattern.exec(twiml)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    
    if (!fullTag.startsWith('</')) {
      // Skip self-closing tags
      if (!fullTag.endsWith('/>')) {
        openTags.push(tagName);
      }
    } else {
      // Closing tag
      const lastOpenTag = openTags.pop();
      if (lastOpenTag !== tagName) {
        return { 
          isValid: false, 
          error: 'Unbalanced tags: found closing tag but expected another' 
        };
      }
    }
  }
  
  if (openTags.length > 0) {
    return { 
      isValid: false, 
      error: 'Unclosed tags detected' 
    };
  }
  
  return { isValid: true };
}

/**
 * Build a safe TwiML response with validation
 * @param {string} innerXml - TwiML content inside the <Response> tags
 * @returns {string} Validated TwiML document or safe fallback
 */
function buildSafeTwiml(innerXml) {
  try {
    const twiml = buildTwiml(innerXml);
    const validation = validateTwiml(twiml);
    
    if (!validation.isValid) {
      console.error('Invalid TwiML: ' + validation.error);
      // Return a safe fallback TwiML
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say>We\'re sorry, there was an error with our system. Please try again later.</Say></Response>';
    }
    
    return twiml;
  } catch (error) {
    console.error('Error building TwiML:', error);
    return '<?xml version="1.0" encoding="UTF-8"?><Response><Say>We\'re sorry, there was an error with our system. Please try again later.</Say></Response>';
  }
}

/**
 * Build a Say element with proper voice and text
 * @param {string} text - Text to speak
 * @param {Object} options - Options for the Say element
 * @returns {string} TwiML Say element
 */
function buildSay(text, options = {}) {
  const {
    voice = 'alice',
    language = 'en-US',
    loop = 1
  } = options;
  
  const safeText = escapeXml(text);
  
  return `<Say voice="${voice}" language="${language}" loop="${loop}">${safeText}</Say>`;
}

/**
 * Build a Pause element
 * @param {number} length - Pause length in seconds
 * @returns {string} TwiML Pause element
 */
function buildPause(length = 1) {
  return `<Pause length="${length}"/>`;
}

/**
 * Build a Gather element for collecting user input
 * @param {string} promptText - Text to speak before gathering input
 * @param {Object} options - Options for the Gather element
 * @returns {string} TwiML Gather element
 */
function buildGather(promptText, options = {}) {
  const {
    action,
    method = 'POST',
    timeout = 7,
    speechTimeout = 5,
    speechModel = 'phone_call',
    input = 'dtmf speech',
    hints = '',
    numDigits = '',
    voice = 'alice'
  } = options;
  
  const safePrompt = escapeXml(promptText);
  const safeAction = escapeXml(action);
  
  let gatherAttrs = `input="${input}" timeout="${timeout}" speechTimeout="${speechTimeout}" speechModel="${speechModel}" action="${safeAction}" method="${method}"`;
  
  if (hints) {
    gatherAttrs += ` hints="${escapeXml(hints)}"`;
  }
  
  if (numDigits) {
    gatherAttrs += ` numDigits="${numDigits}"`;
  }
  
  return `<Gather ${gatherAttrs}>` +
    `<Say voice="${voice}">${safePrompt}</Say>` +
    `</Gather>`;
}

/**
 * Build the initial prompt TwiML
 * @param {Object} session - Session data
 * @returns {string} Complete TwiML document
 */
function buildInitialPrompt(session) {
  const { productContext } = session;
  const { managerName, hotelName, recommendedProduct, lastProduct } = productContext;
  
  const safeManagerName = escapeXml(managerName || '');
  const safeHotelName = escapeXml(hotelName || '');
  const safeRecommendedProduct = escapeXml(recommendedProduct || '');
  const safeLastProduct = escapeXml(lastProduct || '');
  
  // Update session with prompt type
  session.lastPromptType = 'YES_NO_QUESTION';
  
  // Build the greeting and product recommendation
  let innerXml = buildSay(`Hello ${safeManagerName}, this is ArrayLink AI calling for ${safeHotelName}.`);
  innerXml += buildPause(1);
  
  innerXml += buildSay(`We noticed you've been ordering ${safeLastProduct} regularly. We'd like to recommend trying our ${safeRecommendedProduct}.`);
  innerXml += buildPause(1);
  
  // Build the gather element for user response
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  innerXml += buildGather(
    `Would you be interested in adding this to your next order?`,
    {
      action: `${baseUrl}/api/call-response`,
      hints: 'yes,no,maybe,tell me more,what is the difference,why,how,details',
      speechTimeout: 5
    }
  );
  
  // Add fallback message if no input is received
  innerXml += buildSay(`We didn't receive your response. Thank you for your time. Goodbye.`);
  
  return buildTwiml(innerXml);
}

/**
 * Build a response based on detected intent
 * @param {Object} intent - Detected intent
 * @param {Object} session - Session data
 * @returns {string} Complete TwiML document
 */
function buildIntentResponse(intent, session) {
  const { productContext } = session;
  const { recommendedProduct } = productContext;
  const safeProduct = escapeXml(recommendedProduct || 'our product');
  
  let innerXml = '';
  
  switch (intent.intent) {
    case 'CONFIRM':
      innerXml += buildSay(`Great! I'll add ${safeProduct} to your next order.`);
      innerXml += buildPause(1);
      innerXml += buildSay(`Thank you for your business. Have a wonderful day!`);
      break;
      
    case 'DECLINE':
      innerXml += buildSay(`No problem at all. We appreciate your consideration.`);
      innerXml += buildPause(1);
      innerXml += buildSay(`Is there anything else you'd like to know about our products?`);
      
      // Add a gather for follow-up
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      innerXml += buildGather(
        `You can say yes for more information or no to end this call.`,
        {
          action: `${baseUrl}/api/call-response`,
          hints: 'yes,no,tell me more',
          speechTimeout: 5
        }
      );
      
      innerXml += buildSay(`Thank you for your time. Goodbye.`);
      break;
      
    case 'REPEAT':
      // Rebuild the initial prompt
      return buildInitialPrompt(session);
      
    case 'SCHEDULE':
      innerXml += buildSay(`I understand you'd like to discuss this later.`);
      innerXml += buildPause(1);
      innerXml += buildSay(`We'll call you back at a more convenient time. Thank you and have a great day!`);
      break;
      
    default:
      // Fallback to a generic response
      innerXml += buildSay(`I understand. Thank you for your feedback.`);
      innerXml += buildPause(1);
      innerXml += buildSay(`Have a wonderful day!`);
  }
  
  return buildTwiml(innerXml);
}

/**
 * Build a response using LLM-generated content
 * @param {string} llmResponse - Response from LLM
 * @param {Object} session - Session data
 * @returns {string} Complete TwiML document
 */
function buildLlmResponse(llmResponse, session) {
  // Update session
  session.lastPromptType = 'LLM_RESPONSE';
  
  // Split LLM response into sentences for better pacing
  const sentences = llmResponse.split(/(?<=[.!?])\s+/);
  
  let innerXml = '';
  
  // Add each sentence with natural pauses
  sentences.forEach((sentence, index) => {
    if (sentence.trim()) {
      innerXml += buildSay(sentence.trim());
      
      // Add pause between sentences, but not after the last one
      if (index < sentences.length - 1) {
        innerXml += buildPause(0.5);
      }
    }
  });
  
  // Add a follow-up question
  innerXml += buildPause(1);
  
  // Add a gather for follow-up
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  innerXml += buildGather(
    `Would you like to add this product to your next order?`,
    {
      action: `${baseUrl}/api/call-response`,
      hints: 'yes,no,maybe,tell me more',
      speechTimeout: 5
    }
  );
  
  // Add fallback message
  innerXml += buildSay(`We didn't receive your response. Thank you for your time. Goodbye.`);
  
  return buildTwiml(innerXml);
}

/**
 * Build a context-aware fallback response
 * @param {Object} session - Session data
 * @returns {string} Complete TwiML document
 */
function buildContextAwareFallback(session) {
  let fallbackMessage = '';
  
  // Different fallbacks based on conversation state
  if (!session.lastIntent) {
    fallbackMessage = "I'm sorry, I didn't catch that. Would you like to hear about our recommended product for your hotel?";
  } else if (session.lastIntent === 'QUESTION') {
    const safeProduct = escapeXml(session.productContext?.recommendedProduct || 'our product');
    fallbackMessage = `I'm sorry, I didn't understand your question. Would you like me to tell you more about ${safeProduct}?`;
  } else if (session.lastPromptType === 'YES_NO_QUESTION') {
    fallbackMessage = "I'm sorry, I didn't catch that. Please say yes if you're interested, or no if you're not.";
  } else {
    // Default fallback with clear options
    fallbackMessage = "I'm sorry, I didn't catch that. Would you like me to repeat the product recommendation or answer a question about it?";
  }
  
  let innerXml = buildSay(fallbackMessage);
  
  // Add a gather for retry
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  innerXml += buildGather(
    `Please try again.`,
    {
      action: `${baseUrl}/api/call-response`,
      hints: 'yes,no,repeat,tell me more',
      speechTimeout: 5
    }
  );
  
  // Add final fallback message
  innerXml += buildSay(`We didn't receive your response. Thank you for your time. Goodbye.`);
  
  return buildTwiml(innerXml);
}

/**
 * Build a safe fallback response for catastrophic errors
 * @returns {string} Complete TwiML document
 */
function buildSafeFallback() {
  return buildTwiml(
    buildSay("I'm sorry, there was a problem with our system. Please try again later.") +
    buildPause(1) +
    buildSay("Thank you for your understanding. Goodbye.")
  );
}

module.exports = {
  escapeXml,
  buildTwiml,
  validateTwiml,
  buildSafeTwiml,
  buildSay,
  buildPause,
  buildGather,
  buildInitialPrompt,
  buildIntentResponse,
  buildLlmResponse,
  buildContextAwareFallback,
  buildSafeFallback
};
