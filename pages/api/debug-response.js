export default function handler(req, res) {
  try {
    // Log everything about the incoming request
    console.log('🔍 DEBUG ENDPOINT HIT:');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Always return a 200 OK with a simple TwiML response
    const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Debug endpoint received your request.</Say></Response>';
    
    // Set the content type to XML - exactly as 'text/xml'
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
    
    console.log('Debug endpoint responded successfully');
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).send('Error in debug endpoint');
  }
}
