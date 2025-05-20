/**
 * High-precision intent router for fast response times
 * Handles common phrases without needing LLM processing
 */

// Intent categories with their associated phrases
const INTENT_PHRASES = {
  CONFIRM: [
    'yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'sounds good', 
    'i\'ll take it', 'definitely', 'absolutely', 'correct', 'right',
    'that works', 'fine', 'good', 'great', 'perfect', 'alright'
  ],
  DECLINE: [
    'no', 'nope', 'not interested', 'maybe later', 'no thanks', 
    'pass', 'decline', 'negative', 'not now', 'not today',
    'i don\'t think so', 'not really', 'no way'
  ],
  REPEAT: [
    'repeat', 'say that again', 'what did you say', 'come again',
    'i didn\'t hear', 'pardon', 'sorry', 'what was that',
    'can you repeat', 'one more time', 'again please'
  ],
  SCHEDULE: [
    'call me later', 'call back', 'schedule', 'another time',
    'later', 'not now', 'reschedule', 'tomorrow', 'next week',
    'can we talk later', 'better time'
  ],
  QUESTION: [
    'what', 'why', 'how', 'when', 'where', 'which', 'who',
    'difference', 'tell me', 'explain', 'more', 'about',
    'details', 'information', 'compare', 'versus', 'vs'
  ]
};

/**
 * Detects intent from user speech with confidence scoring
 * @param {string} input - User's speech input
 * @param {number} confidenceThreshold - Minimum confidence to match (0.0-1.0)
 * @returns {Object|null} Intent object or null if no match above threshold
 */
function detectIntent(input, confidenceThreshold = 0.7) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Normalize input
  const normalizedInput = input.toLowerCase().trim();
  
  // Track best match
  let bestMatch = {
    intent: null,
    confidence: 0,
    matchedPhrase: null
  };

  // Check each intent category
  for (const [intent, phrases] of Object.entries(INTENT_PHRASES)) {
    for (const phrase of phrases) {
      // Exact match gives highest confidence
      if (normalizedInput === phrase) {
        return {
          intent,
          confidence: 1.0,
          matchedPhrase: phrase
        };
      }
      
      // Check if input contains the phrase
      if (normalizedInput.includes(phrase)) {
        // Calculate confidence based on phrase length relative to input length
        const coverage = phrase.length / normalizedInput.length;
        const confidence = 0.7 + (coverage * 0.3); // Scale from 0.7 to 1.0
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence,
            matchedPhrase: phrase
          };
        }
      }
    }
  }

  // Return the best match if it meets the threshold
  if (bestMatch.confidence >= confidenceThreshold) {
    return bestMatch;
  }
  
  return null;
}

/**
 * Detects multiple intents in a single input
 * Handles complex responses like "Yes, but what about..."
 * @param {string} input - User's speech input
 * @param {number} confidenceThreshold - Minimum confidence to match (0.0-1.0)
 * @returns {Array} Array of intent objects sorted by priority and confidence
 */
function detectMultipleIntents(input, confidenceThreshold = 0.6) {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const normalizedInput = input.toLowerCase().trim();
  const matches = [];
  
  // Intent priority weights - higher values mean higher priority
  const intentPriority = {
    'QUESTION': 10,   // Questions take highest priority
    'REPEAT': 8,      // Requests to repeat are important
    'SCHEDULE': 6,    // Scheduling requests are significant
    'DECLINE': 4,     // Decline is important but not as much as questions
    'CONFIRM': 2      // Confirm is lowest priority (often part of compound statements)
  };
  
  // Check each intent category
  for (const [intent, phrases] of Object.entries(INTENT_PHRASES)) {
    for (const phrase of phrases) {
      if (normalizedInput.includes(phrase)) {
        // Calculate confidence
        const coverage = phrase.length / normalizedInput.length;
        const confidence = 0.6 + (coverage * 0.4);
        
        // Calculate position in the input (earlier = more important)
        const position = normalizedInput.indexOf(phrase) / normalizedInput.length;
        const positionScore = 1 - position; // Convert to 0-1 where 1 means at the start
        
        if (confidence >= confidenceThreshold) {
          matches.push({
            intent,
            confidence,
            priority: intentPriority[intent] || 0,
            positionScore,
            matchedPhrase: phrase
          });
        }
      }
    }
  }
  
  // Special handling for compound statements with questions
  const hasConfirm = matches.some(m => m.intent === 'CONFIRM');
  const hasQuestion = matches.some(m => m.intent === 'QUESTION');
  
  if (hasConfirm && hasQuestion) {
    // Boost question priority in compound statements
    matches.forEach(match => {
      if (match.intent === 'QUESTION') {
        match.priority += 5;
        match.confidence = Math.min(match.confidence + 0.1, 1.0);
      }
    });
  }
  
  // Sort by priority first, then by confidence
  return matches.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    if (a.positionScore !== b.positionScore) {
      return b.positionScore - a.positionScore; // Earlier in sentence first
    }
    return b.confidence - a.confidence; // Higher confidence first
  });
}

/**
 * Determines if input requires LLM processing
 * @param {string} input - User's speech input
 * @returns {boolean} True if input needs LLM processing
 */
function needsLlmProcessing(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for question indicators
  const questionIndicators = [
    'what', 'why', 'how', 'when', 'where', 'which', 'who', 'can you', 'could you',
    'difference', 'tell me', 'explain', 'more', 'about', 'details', 'information',
    'compare', 'versus', 'vs', 'better', 'best', 'recommend', 'suggestion'
  ];
  
  return questionIndicators.some(indicator => normalizedInput.includes(indicator));
}

module.exports = {
  detectIntent,
  detectMultipleIntents,
  needsLlmProcessing,
  INTENT_PHRASES
};
