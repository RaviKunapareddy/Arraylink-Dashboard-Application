import { createTwiMLResponse } from '../../../services/twilioService';
import scriptStorage from '../../../services/storageService';

export default function handler(req, res) {
  if (req.method === 'POST' || req.method === 'GET') {
    try {
      // Twilio sends the CallSid in the request parameters
      const callSid = req.body?.CallSid || req.query?.CallSid;
      console.log(`Voice endpoint called with CallSid: ${callSid || 'not provided'}`);
      
      // Retrieve the script from storage
      let script = null;
      if (callSid) {
        script = scriptStorage.getScript(callSid);
        console.log(`Retrieved script for call ${callSid}:`, script);
      }
      
      // If no script found, use a default message
      if (!script) {
        script = "Hello, this is ArrayLink AI calling. I wanted to discuss some exciting new products that might interest you. Would you have a moment to chat?";
        console.log('Using default fallback script');
      }
      
      // Create TwiML response with enhanced voice
      const twiml = createTwiMLResponse(script);
      
      // Set the content type to XML and send the response
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(twiml);
    } catch (error) {
      console.error('Error in Twilio voice handler:', error);
      
      // Even in case of error, we need to respond with valid TwiML
      const errorTwiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="Polly.Joanna-Neural">
            <speak>
              Hello, this is ArrayLink AI calling. I apologize, but I'm having trouble accessing our conversation script. 
              Would you mind if I call you back in a few minutes? Thank you for your understanding.
            </speak>
          </Say>
        </Response>
      `;
      
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(errorTwiml);
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 