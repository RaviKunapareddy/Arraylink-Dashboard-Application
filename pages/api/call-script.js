export default function handler(req, res) {
  const { hotelName, managerName, recommendedProduct, lastProduct } = req.query;
  
  // Create a TwiML response with personalized script
  const twiml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Hello ${managerName}, this is ArrayLink AI calling from our sales department.</Say>
      <Pause length="1"/>
      <Say voice="alice">We noticed that ${hotelName} recently purchased ${lastProduct}.</Say>
      <Pause length="1"/>
      <Say voice="alice">Based on your purchase history, we'd like to recommend our ${recommendedProduct}.</Say>
      <Pause length="1"/>
      <Say voice="alice">Would you like to hear more about this product?</Say>
      <Gather numDigits="1" action="/api/call-response" method="POST">
        <Say voice="alice">Press 1 for yes, or 2 for no.</Say>
      </Gather>
      <Say voice="alice">We didn't receive your response. Thank you for your time. Goodbye.</Say>
    </Response>
  `;
  
  // Set the content type to XML
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}
