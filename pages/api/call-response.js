export default function handler(req, res) {
  // Get the digit pressed by the user
  const { Digits } = req.body;
  
  // Get the base URL from environment or use the request host
  const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
  
  // Log the received input for debugging
  console.log(`Call response received with digit: ${Digits}`);
  
  // Create a TwiML response based on the user's input
  let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';
  
  if (Digits === '1') {
    // User pressed 1 (yes)
    twiml += `
      <Say voice="alice">Great! We're excited that you're interested in our product.</Say>
      <Pause length="1"/>
      <Say voice="alice">One of our sales representatives will contact you shortly with more information and special pricing.</Say>
      <Pause length="1"/>
      <Say voice="alice">Thank you for your time. Have a great day!</Say>
    `;
    console.log('Customer expressed interest in the product');
  } else if (Digits === '2') {
    // User pressed 2 (no)
    twiml += `
      <Say voice="alice">We understand. Thank you for your time.</Say>
      <Pause length="1"/>
      <Say voice="alice">If you change your mind, feel free to reach out to us. Have a great day!</Say>
    `;
    console.log('Customer declined interest in the product');
  } else {
    // User pressed something else
    twiml += `
      <Say voice="alice">Sorry, I didn't understand your response.</Say>
      <Gather numDigits="1" action="${baseUrl}/api/call-response" method="POST">
        <Say voice="alice">Press 1 if you're interested in our product, or 2 if you're not interested.</Say>
      </Gather>
    `;
    console.log(`Unrecognized response: ${Digits}, prompting again`);
  }
  
  twiml += '\n</Response>';
  
  // Set the content type to XML
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}
