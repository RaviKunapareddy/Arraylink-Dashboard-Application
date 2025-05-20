// Import our enhanced Twilio client with retry logic
const twilioClient = require('../../utils/twilioClient');
// Import logger for better debugging
const logger = require('../../utils/logger');

// Helper function to validate environment variables
function validateEnvVars() {
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prospectId, phoneNumber, managerName, hotelName, recommendedProduct, lastProduct } = req.body;
    
    // Log the request for debugging
    console.log(`Outreach request received for ${managerName} at ${hotelName}`);
    console.log(`Phone: ${phoneNumber}, Product: ${recommendedProduct}`);
    
    // Validate required fields
    if (!phoneNumber || !managerName || !hotelName || !recommendedProduct) {
      console.error('Missing required fields in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, managerName, hotelName, and recommendedProduct are required'
      });
    }
    
    try {
      // Validate environment variables
      if (!validateEnvVars()) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error: Missing Twilio credentials'
        });
      }
      
      // Get Twilio phone number from environment variables
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      // Get the base URL for our TwiML scripts with proper fallback for development
      let baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
          baseUrl = `http://${req.headers.host}`;
          logger.logTwilioInteraction(req, 'DEV_FALLBACK_URL', { baseUrl });
        } else {
          throw new Error('BASE_URL environment variable is not set in production');
        }
      }
      
      // Log the request details
      logger.logTwilioInteraction(req, 'OUTREACH_CALL_REQUEST', {
        phoneNumber,
        managerName,
        hotelName,
        recommendedProduct,
        lastProduct,
        baseUrl
      });
      
      // Construct the TwiML URL
      const twimlUrl = `${baseUrl}/api/call-script?hotelName=${encodeURIComponent(hotelName)}&managerName=${encodeURIComponent(managerName)}&recommendedProduct=${encodeURIComponent(recommendedProduct)}&lastProduct=${encodeURIComponent(lastProduct || 'your previous order')}`;
      
      // Prepare call parameters
      const callParams = {
        url: twimlUrl,
        to: phoneNumber,
        from: twilioPhoneNumber,
        statusCallback: `${baseUrl}/api/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      };
      
      // Make an actual call with Twilio using our custom script with retry logic
      const callStartTime = Date.now();
      const call = await twilioClient.createCall(callParams);
      
      // Log success with performance metrics
      const callDuration = Date.now() - callStartTime;
      logger.logPerformance('OUTREACH_CALL_SUCCESS', callDuration, {
        callSid: call.sid,
        managerName,
        hotelName,
        recommendedProduct
      });
      
      // Return success response with call SID
      res.status(200).json({ 
        success: true, 
        message: `Outreach call initiated for prospect ID: ${prospectId}`,
        callSid: call.sid
      });
    } catch (error) {
      // Enhanced error logging
      logger.logError('OUTREACH_CALL_FAILURE', error, {
        phoneNumber,
        managerName,
        hotelName,
        recommendedProduct,
        prospectId
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initiate call',
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 