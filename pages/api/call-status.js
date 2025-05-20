export default function handler(req, res) {
  if (req.method === 'POST') {
    // Extract call status information from the request
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To
    } = req.body;

    // Log the call status for monitoring
    console.log(`Call Status Update - SID: ${CallSid}`);
    console.log(`Status: ${CallStatus}, Duration: ${CallDuration || 'N/A'} seconds`);
    console.log(`From: ${From} To: ${To}`);

    // In a production app, you might want to:
    // 1. Store this information in a database
    // 2. Update your UI in real-time using websockets
    // 3. Trigger follow-up actions based on call status

    // Send a success response back to Twilio
    res.status(200).send('OK');
  } else {
    // Only accept POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
