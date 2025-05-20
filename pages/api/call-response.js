export default function handler(req, res) {
  try {
    // Get the digit pressed or speech input by the user
    const Digits = req.body.Digits || '';
    const SpeechResult = req.body.SpeechResult || '';
    const Confidence = req.body.Confidence || 'N/A';
    
    // Check for speech input in all possible Twilio parameters
    // Twilio might send speech results in different parameters depending on the API version
    const possibleSpeechInput = SpeechResult || 
                              req.body.Speech || 
                              req.body.SpeechTranscript || 
                              req.body.SpeechText || 
                              '';
    
    // Get the base URL from environment or use the request host
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    
    // Log the received input for debugging with detailed information
    console.log('--- Twilio POST Payload ---');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('Call response received:');
    console.log('DTMF Input:', Digits);
    console.log('Speech Result:', SpeechResult);
    console.log('Speech Confidence:', Confidence);
    console.log(`Using base URL: ${baseUrl}`);
    
    // Log whether this is a speech or DTMF response
    if (SpeechResult) {
      console.log('✅ SPEECH RECOGNITION SUCCESSFUL!');
    } else if (Digits) {
      console.log('✅ DTMF INPUT RECEIVED!');
    } else {
      console.log('⚠️ NO INPUT DETECTED!');
    }
    
    // Helper function to escape XML special characters
    const escapeXml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    // Create a TwiML response based on the user's input
    let twiml = '';
    
    // Process the speech input (caller's name)
    // Ensure the XML declaration is the very first character with no whitespace
    
    if (SpeechResult) {
      // The caller said their name, repeat it back
      const callerName = escapeXml(SpeechResult.trim());
      
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say voice="alice">Thank you! You said your name is ${callerName}.</Say>
        <Pause length="1"/>
        <Say voice="alice">Our speech recognition system is working correctly.</Say>
        <Pause length="1"/>
        <Say voice="alice">Thank you for helping us test our system. Have a great day!</Say>
      </Response>`.replace(/\n\s*/g, '');
      
      console.log(`Successfully recognized caller's name: ${callerName}`);
    } else {
      // No speech input was detected
      const safeBaseUrl = escapeXml(baseUrl);
      
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say voice="alice">I'm sorry, I didn't catch your name.</Say>
        <Pause length="1"/>
        <Gather input="speech" 
          timeout="7" 
          speechTimeout="5" 
          speechModel="phone_call" 
          action="${safeBaseUrl}/api/call-response" 
          method="POST">
          <Say voice="alice">Could you please tell me your name again?</Say>
        </Gather>
      </Response>`.replace(/\n\s*/g, '');
      
      console.log('No speech input detected, prompting again');
    }
    
    // Set the content type to XML - exactly as 'text/xml'
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
    console.log('TwiML response sent successfully');
  } catch (error) {
    console.error('Error generating response TwiML:', error);
    
    // Send a simple valid TwiML response in case of error
    // Using template string with no whitespace before XML declaration
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, there was an error with our system. Please try again later.</Say></Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(fallbackTwiml);
  }
}
