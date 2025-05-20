export default function handler(req, res) {
  try {
    // Get the digit pressed by the user
    const Digits = req.body.Digits || '';
    
    // Get the base URL from environment or use the request host
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    
    // Log the received input for debugging
    console.log(`Call response received with digit: ${Digits}`);
    console.log(`Using base URL: ${baseUrl}`);
    
    // Helper function to escape XML special characters
    const escapeXml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    // Create a TwiML response based on the user's input
    let twiml = '';
    
    // Ensure the XML declaration is the very first character with no whitespace
    if (Digits === '1') {
      // User pressed 1 (yes)
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Great! We're excited that you're interested in our product.</Say><Pause length="1"/><Say voice="alice">One of our sales representatives will contact you shortly with more information and special pricing.</Say><Pause length="1"/><Say voice="alice">Thank you for your time. Have a great day!</Say></Response>`;
      console.log('Customer expressed interest in the product');
    } else if (Digits === '2') {
      // User pressed 2 (no)
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">We understand. Thank you for your time.</Say><Pause length="1"/><Say voice="alice">If you change your mind, feel free to reach out to us. Have a great day!</Say></Response>`;
      console.log('Customer declined interest in the product');
    } else {
      // User pressed something else or no input
      // Use escapeXml for the dynamic baseUrl to prevent XML injection
      const safeBaseUrl = escapeXml(baseUrl);
      twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Sorry, I didn't understand your response.</Say><Gather numDigits="1" action="${safeBaseUrl}/api/call-response" method="POST"><Say voice="alice">Press 1 if you're interested in our product, or 2 if you're not interested.</Say></Gather></Response>`;
      console.log(`Unrecognized response: ${Digits}, prompting again`);
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
