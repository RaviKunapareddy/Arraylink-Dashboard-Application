// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Import utility modules
const contextManager = require('../../utils/contextManager');
const twimlBuilder = require('../../utils/twimlBuilder');
const logger = require('../../utils/logger');

export default function handler(req, res) {
  try {
    // Extract parameters from the query string
    const { managerName, hotelName, recommendedProduct, lastProduct } = req.query;
    
    // Validate required parameters
    if (!managerName || !hotelName || !recommendedProduct) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get the CallSid from either body (POST) or query (GET) or generate a unique ID
    // Note: Twilio sends CallSid in body for POST requests, but in query for GET requests
    // For initial script requests, Twilio uses GET and CallSid might be in a different case
    const callSid = req.body?.CallSid || req.query?.CallSid || req.query?.callSid || `session_${Date.now()}`;
    logger.logTwilioInteraction(req, 'CALL_SID_DETECTION', { callSid, method: req.method });
    
    // Log the timestamp when TwiML generation starts for latency tracking
    const twimlStartTime = Date.now();
    logger.logPerformance('TWIML_GENERATION_START', twimlStartTime);
    
    // CRITICAL: Always use environment variable for BASE_URL in production
    // Never trust req.headers.host as it can be localhost if Azure reverse proxy misroutes
    let baseUrl = process.env.BASE_URL;
    
    // Fallback for development environments
    if (!baseUrl) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        // In development, we can use the request host
        baseUrl = `http://${req.headers.host}`;
        logger.logTwilioInteraction(req, 'DEV_FALLBACK_URL', { baseUrl });
      } else {
        // In production, this is a critical error
        logger.logError('MISSING_BASE_URL', new Error('BASE_URL environment variable is not set'));
        return res.status(500).json({ error: 'Server configuration error: BASE_URL not set' });
      }
    }
    
    // Initialize session with product context
    const session = contextManager.createNewSession(callSid);
    session.productContext = {
      managerName,
      hotelName,
      recommendedProduct,
      lastProduct
    };
    contextManager.setSession(callSid, session);
    
    // Log the incoming call
    logger.logTwilioInteraction(req, 'INITIAL_CALL', { session });
    
    // Build TwiML response using the builder
    const twiml = twimlBuilder.buildInitialPrompt(session);
    
    // Validate TwiML before sending
    const validation = twimlBuilder.validateTwiml(twiml);
    if (!validation.isValid) {
      logger.logError('INVALID_TWIML', new Error(validation.error), { twiml });
      // Use safe fallback TwiML instead
      const safeTwiml = twimlBuilder.buildSafeFallback();
      
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(safeTwiml);
      logger.logPerformance('TWIML_FALLBACK_GENERATION', Date.now() - twimlStartTime);
      return;
    }
    
    // Log the exact TwiML being sent for debugging
    console.log('Final TwiML returned:', twiml);
    
    // Set the content type to XML - exactly as 'text/xml'
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
    logger.logPerformance('TWIML_GENERATION', Date.now() - session.startTime);
    console.log('TwiML script sent successfully');
  } catch (error) {
    logger.logError('INITIAL_CALL_ERROR', error);
    
    // Send a simple valid TwiML response in case of error
    const fallbackTwiml = twimlBuilder.buildSafeFallback();
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(fallbackTwiml);
  }
}
