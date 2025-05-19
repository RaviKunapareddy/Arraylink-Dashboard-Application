import { makeOutboundCall } from '../../services/twilioService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { 
        prospectId, 
        hotelName, 
        managerName, 
        lastProduct, 
        recommendedProduct,
        phoneNumber = '+12345678900' // Default test number - replace with real data in production
      } = req.body;
      
      // Customer info for AI personalization
      const customerInfo = {
        hotelName,
        managerName,
        lastProduct,
        recommendedProduct
      };
      
      // Make the call using Twilio
      const callResult = await makeOutboundCall(phoneNumber, customerInfo);
      
      if (callResult.success) {
        res.status(200).json({ 
          success: true, 
          message: `Outreach initiated for prospect ID: ${prospectId}`,
          callSid: callResult.callSid,
          callStatus: callResult.status
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: `Failed to initiate call: ${callResult.error}` 
        });
      }
    } catch (error) {
      console.error('Error initiating outreach:', error);
      res.status(500).json({ 
        success: false, 
        message: `Error: ${error.message}` 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 