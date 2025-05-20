export default function handler(req, res) {
  try {
    // Extract the query parameters
    const { managerName, hotelName, recommendedProduct, lastProduct } = req.query;
    
    // Get the base URL from environment or use the request host
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    
    // Log the parameters for debugging
    console.log('Call script parameters:');
    console.log(`Manager Name: ${managerName}`);
    console.log(`Hotel Name: ${hotelName}`);
    console.log(`Recommended Product: ${recommendedProduct}`);
    console.log(`Last Product: ${lastProduct}`);
    console.log(`Base URL: ${baseUrl}`);
    
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
    
    // Escape all dynamic values to prevent XML injection
    const safeManagerName = escapeXml(managerName);
    const safeHotelName = escapeXml(hotelName);
    const safeRecommendedProduct = escapeXml(recommendedProduct);
    const safeLastProduct = escapeXml(lastProduct);
    const safeBaseUrl = escapeXml(baseUrl);
    
    // Create a clean TwiML response with no extra whitespace
    // Ensure the XML declaration is the very first character with no whitespace
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Hello ${safeManagerName}, this is ArrayLink AI calling from our sales department.</Say><Pause length="1"/><Say voice="alice">We noticed that ${safeHotelName} recently purchased ${safeLastProduct}.</Say><Pause length="1"/><Say voice="alice">Based on your purchase history, we'd like to recommend our ${safeRecommendedProduct}.</Say><Pause length="1"/><Say voice="alice">Would you like to hear more about this product?</Say><Gather numDigits="1" action="${safeBaseUrl}/api/call-response" method="POST"><Say voice="alice">Press 1 for yes, or 2 for no.</Say></Gather><Say voice="alice">We didn't receive your response. Thank you for your time. Goodbye.</Say></Response>`;
    
    // Set the content type to XML - exactly as 'text/xml'
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
    console.log('TwiML script sent successfully');
  } catch (error) {
    console.error('Error generating TwiML:', error);
    
    // Send a simple valid TwiML response in case of error
    // Using template string with no whitespace before XML declaration
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, there was an error with our system. Please try again later.</Say></Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(fallbackTwiml);
  }
}
