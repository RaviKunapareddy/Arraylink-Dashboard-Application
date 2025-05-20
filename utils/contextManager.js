/**
 * Context Manager for Twilio Voice AI Assistant
 * Maintains conversation state across interactions
 */

// In-memory session store (use Redis in production)
const sessionMap = new Map();

/**
 * Get session data for a call
 * @param {string} callSid - Twilio Call SID
 * @returns {Object} Session data
 */
function getSession(callSid) {
  if (!callSid) {
    console.warn('getSession called without callSid');
    return createNewSession('unknown');
  }
  
  return sessionMap.get(callSid) || createNewSession(callSid);
}

/**
 * Save session data for a call
 * @param {string} callSid - Twilio Call SID
 * @param {Object} context - Session data to save
 */
function setSession(callSid, context) {
  if (!callSid) {
    console.warn('setSession called without callSid');
    return;
  }
  
  sessionMap.set(callSid, {
    ...context,
    lastUpdated: Date.now()
  });
}

/**
 * Create a new session
 * @param {string} callSid - Twilio Call SID
 * @returns {Object} New session object
 */
function createNewSession(callSid) {
  return {
    callSid,
    startTime: Date.now(),
    lastUpdated: Date.now(),
    intents: [],
    lastIntent: null,
    lastPromptType: null,
    productContext: {},
    speechHistory: [],
    llmHistory: []
  };
}

/**
 * Delete a session
 * @param {string} callSid - Twilio Call SID
 */
function deleteSession(callSid) {
  sessionMap.delete(callSid);
}

/**
 * Get all active sessions
 * @returns {Array} Array of session objects
 */
function getAllSessions() {
  return Array.from(sessionMap.values());
}

// Cleanup expired sessions every 5 minutes using non-blocking approach
setInterval(() => {
  // Use setImmediate to avoid blocking the event loop
  setImmediate(() => {
    const now = Date.now();
    const expirationTime = 30 * 60 * 1000; // 30 minutes TTL
    let expiredCount = 0;
    
    // Get all entries to avoid concurrent modification issues
    const entries = Array.from(sessionMap.entries());
    
    // Process in chunks to avoid long-running operations
    const processChunk = (startIdx, chunkSize) => {
      const endIdx = Math.min(startIdx + chunkSize, entries.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const [callSid, session] = entries[i];
        if (now - session.lastUpdated > expirationTime) {
          sessionMap.delete(callSid);
          expiredCount++;
        }
      }
      
      // If more chunks to process, schedule next chunk
      if (endIdx < entries.length) {
        setImmediate(() => processChunk(endIdx, chunkSize));
      } else if (expiredCount > 0) {
        console.log(`Cleaned up ${expiredCount} expired sessions`);
      }
    };
    
    // Start processing in chunks of 100
    processChunk(0, 100);
  });
}, 5 * 60 * 1000);

module.exports = {
  getSession,
  setSession,
  createNewSession,
  deleteSession,
  getAllSessions
};
