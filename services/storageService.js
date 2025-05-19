/**
 * Simple in-memory storage for call scripts
 * In a production environment, this would be replaced with a database solution
 */
class CallScriptStorage {
  constructor() {
    this.scripts = new Map();
  }

  /**
   * Store a script for a call
   * @param {string} callSid - The Twilio Call SID
   * @param {string} script - The generated script text
   */
  storeScript(callSid, script) {
    if (!callSid) return;
    this.scripts.set(callSid, script);
    console.log(`Stored script for call ${callSid}`);
  }

  /**
   * Get a script for a call
   * @param {string} callSid - The Twilio Call SID
   * @returns {string|null} - The script if found, null otherwise
   */
  getScript(callSid) {
    if (!callSid) return null;
    return this.scripts.get(callSid) || null;
  }

  /**
   * Delete a script for a call
   * @param {string} callSid - The Twilio Call SID
   */
  deleteScript(callSid) {
    if (!callSid) return;
    if (this.scripts.has(callSid)) {
      this.scripts.delete(callSid);
      console.log(`Removed script for call ${callSid}`);
    }
  }
}

// Create a singleton instance
const scriptStorage = new CallScriptStorage();

module.exports = scriptStorage; 