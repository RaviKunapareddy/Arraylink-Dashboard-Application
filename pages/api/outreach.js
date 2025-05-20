// Import Twilio SDK
const twilio = require('twilio');

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
      
      // Get Twilio credentials from environment variables
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      // Initialize Twilio client
      const client = twilio(accountSid, authToken);
      
      // Get the base URL for our TwiML scripts
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      console.log(`Using base URL: ${baseUrl}`);
      
      // Construct the TwiML URL
      const twimlUrl = `${baseUrl}/api/call-script?hotelName=${encodeURIComponent(hotelName)}&managerName=${encodeURIComponent(managerName)}&recommendedProduct=${encodeURIComponent(recommendedProduct)}&lastProduct=${encodeURIComponent(lastProduct || 'your previous order')}`;
      console.log(`TwiML URL: ${twimlUrl}`);
      
      // Make an actual call with Twilio using our custom script
      const call = await client.calls.create({
        url: twimlUrl,
        to: phoneNumber,
        from: twilioPhoneNumber,
        statusCallback: `${baseUrl}/api/call-status`, // Optional: create this endpoint to track call status
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });
      
      console.log(`Call initiated to ${managerName} at ${hotelName} about ${recommendedProduct}`);
      console.log(`Call SID: ${call.sid}`);
      
      // Return success response with call SID
      res.status(200).json({ 
        success: true, 
        message: `Outreach call initiated for prospect ID: ${prospectId}`,
        callSid: call.sid
      });
    } catch (error) {
      console.error('Error initiating call:', error);
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