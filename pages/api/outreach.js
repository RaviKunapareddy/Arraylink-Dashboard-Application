// Import Twilio SDK
const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prospectId, phoneNumber, managerName, hotelName, recommendedProduct } = req.body;
    
    try {
      // Get Twilio credentials from environment variables
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      // Initialize Twilio client
      const client = twilio(accountSid, authToken);
      
      // Get the base URL for our TwiML scripts
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      
      // Make an actual call with Twilio using our custom script
      const call = await client.calls.create({
        url: `${baseUrl}/api/call-script?hotelName=${encodeURIComponent(hotelName)}&managerName=${encodeURIComponent(managerName)}&recommendedProduct=${encodeURIComponent(recommendedProduct)}&lastProduct=${encodeURIComponent(lastProduct)}`,
        to: phoneNumber,
        from: twilioPhoneNumber,
      });
      
      console.log(`Call initiated to ${managerName} at ${hotelName} about ${recommendedProduct}`);
      
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