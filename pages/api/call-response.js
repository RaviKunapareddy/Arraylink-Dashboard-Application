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
    console.log('Call response received:');
    console.log('DTMF Input:', Digits);
    console.log('Speech Result:', SpeechResult);
    console.log('Speech Confidence:', Confidence);
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log(`Using base URL: ${baseUrl}`);
    
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
    
    // Process both DTMF and speech input with improved recognition
    // Ensure the XML declaration is the very first character with no whitespace
    
    // Normalize speech input for more flexible matching
    const speechLower = possibleSpeechInput.toLowerCase();
    console.log('Normalized speech input:', speechLower);
    
    // More aggressive matching for yes/no responses
    const isYes = speechLower.includes('yes') || 
                 speechLower.includes('yeah') || 
                 speechLower.includes('sure') || 
                 speechLower.includes('one') || 
                 speechLower.includes('1') || 
                 speechLower.includes('yep') || 
                 speechLower.includes('correct') || 
                 speechLower.includes('right');
                 
    const isNo = speechLower.includes('no') || 
               speechLower.includes('nope') || 
               speechLower.includes('not') || 
               speechLower.includes('two') || 
               speechLower.includes('2') || 
               speechLower.includes('nah') || 
               speechLower.includes('negative');
    
    if (Digits === '1' || isYes) {
      // User pressed 1 or said "yes"
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say voice="alice">Great! We're excited that you're interested in our product.</Say>
        <Pause length="1"/>
        <Say voice="alice">One of our sales representatives will contact you shortly with more information and special pricing.</Say>
        <Pause length="1"/>
        <Say voice="alice">Thank you for your time. Have a great day!</Say>
      </Response>`.replace(/\n\s*/g, '');
      console.log('Customer expressed interest in the product');
    } else if (Digits === '2' || isNo) {
      // User pressed 2 or said "no"
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say voice="alice">We understand. Thank you for your time.</Say>
        <Pause length="1"/>
        <Say voice="alice">If you change your mind, feel free to reach out to us. Have a great day!</Say>
      </Response>`.replace(/\n\s*/g, '');
      console.log('Customer declined interest in the product');
    } else {
      // User pressed something else, said something else, or no input
      const safeBaseUrl = escapeXml(baseUrl);
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say voice="alice">Sorry, I didn't understand your response.</Say>
        <Gather input="dtmf speech" 
          timeout="7" 
          speechTimeout="auto" 
          speechModel="phone_call" 
          hints="yes,no,yeah,nope,one,two,1,2,yep,correct,right" 
          action="${safeBaseUrl}/api/call-response" 
          method="POST">
          <Say voice="alice">Please press 1 or clearly say yes if you're interested. Press 2 or say no if you're not interested.</Say>
        </Gather>
      </Response>`.replace(/\n\s*/g, '');
      console.log(`Unrecognized response: DTMF=${Digits}, Speech=${SpeechResult}, prompting again`);
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
