// Import utility modules
const contextManager = require('../../utils/contextManager');
const intentDetector = require('../../utils/intentDetector');
const twimlBuilder = require('../../utils/twimlBuilder');
const logger = require('../../utils/logger');
const failsafe = require('../../utils/failsafe');

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Log the incoming request
    logger.logTwilioInteraction(req, 'USER_RESPONSE');
    
    // Extract user input and call information
    const { SpeechResult, Digits, CallSid, Confidence } = req.body;
    
    // Validate speech input - Twilio sometimes sends empty SpeechResult with Confidence
    const confidenceValue = parseFloat(Confidence) || 0;
    const isSpeechValid = SpeechResult && SpeechResult.trim() && confidenceValue > 0.5;
    
    // Normalize input for better processing
    const userInput = (isSpeechValid ? SpeechResult : Digits || '').trim();
    const normalizedInput = userInput.toLowerCase().trim().replace(/[^\w\s]/g, '');
    
    // Log speech validation
    if (SpeechResult) {
      logger.logTwilioInteraction(req, 'SPEECH_VALIDATION', {
        rawSpeech: SpeechResult,
        confidence: confidenceValue,
        isValid: isSpeechValid
      });
    }
    
    // Get or create session
    const session = contextManager.getSession(CallSid);
    
    // Get the base URL from environment or use the request host
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    
    // Twilio might send speech results in different parameters depending on the API version
    const possibleSpeechInput = SpeechResult || 
                              req.body.Speech || 
                              req.body.RecognizedSpeech || 
                              req.body.SpeechText || 
                              '';
    
    // Update session with latest input
    session.speechHistory.push({
      input: userInput,
      confidence: Confidence,
      timestamp: Date.now(),
      type: SpeechResult ? 'speech' : (Digits ? 'dtmf' : 'none')
    });
    
    // Detect intent from user input
    const intent = intentDetector.detectIntent(userInput);
    const multipleIntents = intentDetector.detectMultipleIntents(userInput);
    
    // Log detected intents
    if (intent) {
      logger.logTwilioInteraction(req, 'INTENT_DETECTED', { intent });
      session.lastIntent = intent.intent;
      session.intents.push(intent);
    }
    
    if (multipleIntents.length > 1) {
      logger.logTwilioInteraction(req, 'MULTIPLE_INTENTS', { intents: multipleIntents });
    }
    
    // Fast path for common intents
    if (intent && ['CONFIRM', 'DECLINE', 'REPEAT', 'SCHEDULE'].includes(intent.intent)) {
      const twiml = twimlBuilder.buildIntentResponse(intent, session);
      contextManager.setSession(CallSid, session);
      
      const responseTime = Date.now() - startTime;
      logger.logPerformance('FAST_PATH_RESPONSE', responseTime, { intent: intent.intent });
      
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(twiml);
      
      // Log TwiML sent timestamp for voice latency tracking
      logger.logPerformance('TWIML_SENT_TIMESTAMP', Date.now(), { 
        responseTime,
        callSid: CallSid,
        responseType: 'FAST_PATH'
      });
      
      return;
    }
    
    // Force LLM fallback if intent is null but LLM processing is needed
    if (!intent && intentDetector.needsLlmProcessing(normalizedInput)) {
      session.lastIntent = 'QUESTION'; // Mark as question for context-aware responses
      logger.logTwilioInteraction(req, 'FORCED_LLM_PROCESSING', { normalizedInput });
    }
    
    // Check if input needs LLM processing
    if (intentDetector.needsLlmProcessing(normalizedInput) || 
        (multipleIntents.some(i => i.intent === 'QUESTION'))) {
      try {
        // Get LLM response with timeout protection
        const llmStartTime = Date.now();
        const sanitizedInput = failsafe.sanitizeUserInput(userInput);
        
        // Create a cache key based on the prompt and product context
        const productContextKey = JSON.stringify({
          lastProduct: session.productContext.lastProduct || '',
          recommendedProduct: session.productContext.recommendedProduct || ''
        });
        const promptKey = `${sanitizedInput}_${productContextKey}`;
        
        // Check cache for existing response
        const cachedResponse = session.llmCache?.[promptKey];
        let llmResponse;
        
        if (cachedResponse) {
          // Use cached response
          llmResponse = cachedResponse;
          logger.logPerformance('LLM_CACHE_HIT', Date.now() - llmStartTime);
        } else {
          // Generate new response
          const prompt = failsafe.buildGeminiPrompt(sanitizedInput, session.productContext);
          llmResponse = await failsafe.getLlmResponseWithTimeout(prompt, 3000);
          
          // Cache the response
          if (!session.llmCache) session.llmCache = {};
          session.llmCache[promptKey] = llmResponse;
        }
        
        const llmResponseTime = Date.now() - llmStartTime;
        
        // Log LLM performance
        logger.logTwilioInteraction(req, 'LLM_RESPONSE', {
          llmQuery: sanitizedInput,
          llmResponseTime,
          llmResponse,
          cached: !!cachedResponse
        });
        
        // Store LLM interaction in session
        session.llmHistory.push({
          query: sanitizedInput,
          response: llmResponse,
          timestamp: Date.now(),
          responseTime: llmResponseTime,
          cached: !!cachedResponse
        });
        
        // Build TwiML with LLM response
        const twiml = twimlBuilder.buildLlmResponse(llmResponse, session);
        contextManager.setSession(CallSid, session);
        
        // Validate TwiML before sending
        const validation = twimlBuilder.validateTwiml(twiml);
        if (!validation.isValid) {
          logger.logError('INVALID_TWIML', new Error(validation.error), { twiml, llmResponse });
          // Use safe fallback TwiML instead
          const safeTwiml = twimlBuilder.buildSafeFallback();
          
          res.setHeader('Content-Type', 'text/xml');
          res.status(200).send(safeTwiml);
          logger.logPerformance('TWIML_FALLBACK_GENERATION', Date.now() - startTime);
          return;
        }
        
        const responseTime = Date.now() - startTime;
        logger.logPerformance('LLM_PATH_RESPONSE', responseTime);
        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml);
        
        // Log TwiML sent timestamp for voice latency tracking
        logger.logPerformance('TWIML_SENT_TIMESTAMP', Date.now(), { 
          responseTime,
          llmResponseTime,
          callSid: CallSid,
          responseType: 'LLM_PATH'
        });
        
        return;
      } catch (llmError) {
        // LLM failed or timed out, use fallback
        logger.logError('LLM_ERROR', llmError);
        session.lastError = 'LLM_TIMEOUT';
      }
    }
    
    // Handle speech input specifically (for backward compatibility with name test)
    if (SpeechResult && !intent && !intentDetector.needsLlmProcessing(userInput)) {
      // The caller said their name or something we didn't recognize as an intent
      const callerInput = twimlBuilder.escapeXml(SpeechResult.trim());
      
      // Build a simple response repeating what they said
      const innerXml = twimlBuilder.buildSay(`Thank you! You said: ${callerInput}.`) +
        twimlBuilder.buildPause(1) +
        twimlBuilder.buildSay('Our speech recognition system is working correctly.') +
        twimlBuilder.buildPause(1) +
        twimlBuilder.buildSay('Thank you for helping us test our system. Have a great day!');
      
      const twiml = twimlBuilder.buildTwiml(innerXml);
      contextManager.setSession(CallSid, session);
      
      // Validate TwiML before sending
      const validation = twimlBuilder.validateTwiml(twiml);
      if (!validation.isValid) {
        logger.logError('INVALID_TWIML', new Error(validation.error), { twiml, callerInput });
        // Use safe fallback TwiML instead
        const safeTwiml = twimlBuilder.buildSafeFallback();
        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(safeTwiml);
        logger.logPerformance('TWIML_FALLBACK_GENERATION', Date.now() - startTime);
        return;
      }
      
      const responseTime = Date.now() - startTime;
      logger.logPerformance('SPEECH_RECOGNITION_TEST', responseTime);
      
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(twiml);
      
      // Log TwiML sent timestamp for voice latency tracking
      logger.logPerformance('TWIML_SENT_TIMESTAMP', Date.now(), { 
        responseTime,
        callSid: CallSid,
        responseType: 'SPEECH_TEST'
      });
      
      return;
    }
    
    // If we get here, use context-aware fallback
    const fallbackTwiml = twimlBuilder.buildContextAwareFallback(session);
    contextManager.setSession(CallSid, session);
    
    // Validate TwiML before sending
    const validation = twimlBuilder.validateTwiml(fallbackTwiml);
    if (!validation.isValid) {
      logger.logError('INVALID_FALLBACK_TWIML', new Error(validation.error), { fallbackTwiml });
      // Use safe fallback TwiML instead
      const safeTwiml = twimlBuilder.buildSafeFallback();
      
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(safeTwiml);
      logger.logPerformance('SAFE_FALLBACK_GENERATION', Date.now() - startTime);
      return;
    }
    
    const responseTime = Date.now() - startTime;
    logger.logPerformance('FALLBACK_RESPONSE', responseTime);
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(fallbackTwiml);
    
    // Log TwiML sent timestamp for voice latency tracking
    logger.logPerformance('TWIML_SENT_TIMESTAMP', Date.now(), { 
      responseTime,
      callSid: CallSid,
      responseType: 'FALLBACK'
    });
  } catch (error) {
    // Catastrophic error, use safe fallback
    logger.logError('CATASTROPHIC_ERROR', error);
    const safeFallbackTwiml = twimlBuilder.buildSafeFallback();
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(safeFallbackTwiml);
  }
}
