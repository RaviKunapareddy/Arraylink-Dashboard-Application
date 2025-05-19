export default function handler(req, res) {
  // Only return the first few characters of sensitive values for security
  const maskValue = (value) => {
    if (!value) return 'Not set';
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  };

  res.status(200).json({
    twilio: {
      accountSid: maskValue(process.env.TWILIO_ACCOUNT_SID),
      authToken: maskValue(process.env.TWILIO_AUTH_TOKEN),
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    openai: {
      apiKey: maskValue(process.env.OPENAI_API_KEY),
    },
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
    nodeEnv: process.env.NODE_ENV,
  });
} 