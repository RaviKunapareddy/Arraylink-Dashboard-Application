import scriptStorage from '../../../services/storageService';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract call status information from the request body
      const {
        CallSid,
        CallStatus,
        CallDuration,
        To,
        From,
      } = req.body;
      
      console.log('Twilio Call Status Update:', {
        callSid: CallSid,
        status: CallStatus,
        duration: CallDuration,
        to: To,
        from: From,
      });
      
      // Clean up the script from storage if call is completed or failed
      if (CallSid && ['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
        scriptStorage.deleteScript(CallSid);
      }
      
      // In a production environment, you would:
      // 1. Store this information in a database
      // 2. Update UI via WebSockets
      // 3. Trigger notifications if needed
      
      // For now, just acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error in Twilio status callback:', error);
      res.status(500).json({ error: 'Failed to process status callback' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 