const twilio = require('twilio');
const OpenAI = require('openai');
const scriptStorage = require('./storageService');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Twilio client
const twilioClient = twilio(accountSid, authToken);

/**
 * Generate AI conversation script based on customer information
 * @param {Object} customerInfo - Information about the customer
 * @returns {Promise<string>} - AI generated script
 */
async function generateAIScript(customerInfo) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI sales assistant for a hotel supplies company. Generate a brief, conversational, and natural-sounding script for a sales call. The script should sound like a human, with natural pauses and a friendly tone."
        },
        {
          role: "user",
          content: `Create a short sales script for a call to ${customerInfo.managerName} at ${customerInfo.hotelName}. 
          They previously purchased ${customerInfo.lastProduct} and we're recommending ${customerInfo.recommendedProduct}.
          Keep it under 100 words, conversational and friendly. Include natural pauses and speech patterns.`
        }
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI script:', error);
    return `Hello ${customerInfo.managerName}, this is ArrayLink AI calling from the hotel supplies company. We noticed you previously ordered ${customerInfo.lastProduct} and wanted to recommend our ${customerInfo.recommendedProduct}. Would you be interested in trying this product with your next order?`;
  }
}

/**
 * Create a TwiML response for the call with enhanced voice capabilities
 * @param {string} script - The script to be read
 * @returns {string} - TwiML document as string
 */
function createTwiMLResponse(script) {
  // Clean up the script by removing markdown formatting and extra spaces
  const cleanScript = script
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\[.*?\]/g, '') // Remove placeholders
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .trim();

  // Add natural pauses and speech enhancements
  const enhancedScript = cleanScript
    .replace(/\.\s+/g, '.<break time="750ms"/>')
    .replace(/,\s+/g, ',<break time="500ms"/>')
    .replace(/\?\s+/g, '?<break time="750ms"/>')
    .replace(/!\s+/g, '!<break time="750ms"/>');

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="Polly.Joanna-Neural">
        <speak>
          ${enhancedScript}
          <break time="1s"/>
          Thank you for your time. Have a great day!
        </speak>
      </Say>
    </Response>
  `;
}

/**
 * Get the base URL for webhook endpoints
 * @returns {string} - Base URL
 */
function getBaseUrl() {
  // In production, use the environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://your-production-url.com';
  }
  
  // In development, use ngrok URL if available
  const ngrokUrl = process.env.NGROK_URL;
  if (ngrokUrl) {
    return ngrokUrl;
  }
  
  // Fallback to localhost if ngrok URL is not set
  return 'http://localhost:3000';
}

/**
 * Initiate an outbound call to a customer with enhanced voice capabilities
 * @param {string} customerPhone - Customer's phone number
 * @param {Object} customerInfo - Customer information for personalization
 * @returns {Promise<Object>} - Call information
 */
async function makeOutboundCall(customerPhone, customerInfo) {
  try {
    const script = await generateAIScript(customerInfo);
    
    // Get the base URL and construct the webhook URL
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/api/twilio/voice`;
    
    console.log('Making call with webhook URL:', webhookUrl);
    
    // Store the script first
    const callSid = `CA${Math.random().toString(36).substring(2, 15)}`;
    scriptStorage.storeScript(callSid, script);
    
    const call = await twilioClient.calls.create({
      to: customerPhone,
      from: twilioPhoneNumber,
      url: webhookUrl,
      statusCallback: `${webhookUrl}/status-callback`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });
    
    return {
      success: true,
      callSid: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error('Error making outbound call:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  makeOutboundCall,
  createTwiMLResponse,
  generateAIScript
}; 