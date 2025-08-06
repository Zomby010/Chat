const { v4: uuidv4 } = require('uuid');
const { openai, OPENAI_CONFIG, MENTAL_HEALTH_SYSTEM_PROMPT } = require('../utils/openaiConfig');

// In-memory storage for chat sessions (consider using Redis for production)
const chatSessions = new Map();

// Crisis keywords for additional safety checks
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'not worth living', 
  'harm myself', 'want to die', 'better off dead', 'end my life',
  'take my life', 'no point living', 'can\'t go on', 'want to disappear'
];

// Check for crisis indicators
const detectCrisis = (message) => {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

// Generate crisis response
const generateCrisisResponse = () => {
  return {
    text: "I'm very concerned about what you're sharing. Please reach out for immediate help:\n\n🚨 **Crisis Resources:**\n• **Call 988** - Suicide & Crisis Lifeline (24/7)\n• **Call 911** - If you're in immediate danger\n• **Text HOME to 741741** - Crisis Text Line\n\nYou're not alone, and there are people who want to help you. Please reach out to one of these resources right away.",
    requiresCrisisPanel: true,
    priority: 'critical',
    suggestedReplies: [
      "I want to talk to someone now",
      "Tell me more about these resources",
      "I'm feeling a bit better now",
      "I need more help"
    ]
  };
};

// Build conversation context for OpenAI
const buildConversationContext = (session, newMessage) => {
  const messages = [
    { role: 'system', content: MENTAL_HEALTH_SYSTEM_PROMPT }
  ];

  // Add recent conversation history (last 10 messages to manage token usage)
  const recentMessages = session.messages.slice(-10);
  
  recentMessages.forEach(msg => {
    if (msg.sender === 'user') {
      messages.push({ role: 'user', content: msg.text });
    } else if (msg.sender === 'bot') {
      messages.push({ role: 'assistant', content: msg.text });
    }
  });

  // Add the new user message
  messages.push({ role: 'user', content: newMessage });

  return messages;
};

// Initialize chat session
const initializeChat = async (req, res) => {
  try {
    console.log('🚀 Initializing chat session...', req.body);
    
    const { userInfo } = req.body;
    const sessionId = uuidv4();

    // Create new chat session
    const session = {
      id: sessionId,
      userInfo: userInfo || {},
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Generate personalized welcome message using OpenAI
    const welcomePrompt = `Generate a warm, welcoming message for a mental health support chat. ${userInfo?.name ? `The user's name is ${userInfo.name}.` : ''} ${userInfo?.mood ? `They indicated they're feeling ${userInfo.mood}.` : ''} Keep it brief, supportive, and ask how you can help today.`;

    let welcomeMessage;

    try {
      console.log('🤖 Calling OpenAI for welcome message...');
      
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: MENTAL_HEALTH_SYSTEM_PROMPT },
          { role: 'user', content: welcomePrompt }
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
      });

      const welcomeText = response.choices[0]?.message?.content || 
        `Hello${userInfo?.name ? ` ${userInfo.name}` : ''}! I'm here to support you. How can I help you today?`;

      welcomeMessage = {
        id: uuidv4(),
        text: welcomeText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        suggestedReplies: [
          "I'm feeling anxious",
          "I need coping strategies",
          "I want to talk about my day",
          "I'm having trouble sleeping"
        ]
      };

      console.log('✅ OpenAI welcome message generated successfully');

    } catch (openaiError) {
      console.error('❌ OpenAI error during initialization:', openaiError);
      
      // Provide detailed error info but still create fallback
      let errorMessage = 'OpenAI service temporarily unavailable';
      if (openaiError.code === 'insufficient_quota') {
        errorMessage = 'OpenAI quota exceeded';
      } else if (openaiError.code === 'rate_limit_exceeded') {
        errorMessage = 'OpenAI rate limit exceeded';
      } else if (openaiError.code === 'invalid_api_key') {
        errorMessage = 'OpenAI API key invalid';
      }
      
      console.log(`🔄 Using fallback welcome message due to: ${errorMessage}`);
      
      // Fallback welcome message
      welcomeMessage = {
        id: uuidv4(),
        text: `Hello${userInfo?.name ? ` ${userInfo.name}` : ''}! I'm here to support you. How can I help you today?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        suggestedReplies: [
          "I'm feeling anxious",
          "I need coping strategies", 
          "I want to talk about my day",
          "I'm having trouble sleeping"
        ]
      };
    }

    session.messages.push(welcomeMessage);

    // Handle crisis support type
    let requiresCrisisPanel = false;
    if (userInfo?.supportType === 'crisis') {
      requiresCrisisPanel = true;
      const crisisMessage = {
        id: uuidv4(),
        text: "I notice you mentioned you're in crisis. Please know that you're not alone. If you're in immediate danger, please call 911 or go to your nearest emergency room. I'm here to support you through this.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        priority: 'high'
      };
      session.messages.push(crisisMessage);
    }

    chatSessions.set(sessionId, session);

    const response = {
      sessionId,
      messages: session.messages,
      requiresCrisisPanel,
      quickReplies: session.messages[session.messages.length - 1]?.suggestedReplies || []
    };

    console.log('✅ Chat session initialized successfully:', sessionId);
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));

    res.json(response);

  } catch (error) {
    console.error('❌ Error initializing chat:', error);
    res.status(500).json({ 
      error: 'Failed to initialize chat session',
      message: 'Please try again in a moment.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send message to OpenAI and get response
const sendMessage = async (req, res) => {
  try {
    console.log('💬 Processing message...', req.body);
    
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      console.log('❌ Missing required fields:', { sessionId: !!sessionId, message: !!message });
      return res.status(400).json({ 
        error: 'Session ID and message are required' 
      });
    }

    const session = chatSessions.get(sessionId);
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return res.status(404).json({ 
        error: 'Chat session not found. Please start a new session.' 
      });
    }

    console.log('📝 Session found, processing message...');

    // Add user message to session
    const userMessage = {
      id: uuidv4(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    session.messages.push(userMessage);

    // Check for crisis indicators
    const isCrisis = detectCrisis(message);
    if (isCrisis) {
      console.log('🚨 Crisis detected in message');
      const crisisResponse = generateCrisisResponse();
      const botMessage = {
        id: uuidv4(),
        text: crisisResponse.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        priority: crisisResponse.priority,
        suggestedReplies: crisisResponse.suggestedReplies
      };
      
      session.messages.push(botMessage);
      session.lastActivity = new Date();

      const response = {
        messages: [userMessage, botMessage],
        requiresCrisisPanel: true,
        quickReplies: crisisResponse.suggestedReplies
      };

      console.log('🚨 Crisis response sent');
      return res.json(response);
    }

    // Build conversation context
    const conversationMessages = buildConversationContext(session, message);

    try {
      console.log('🤖 Calling OpenAI for response...');
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: conversationMessages,
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
        presence_penalty: OPENAI_CONFIG.presencePenalty,
        frequency_penalty: OPENAI_CONFIG.frequencyPenalty,
      });

      const botResponseText = response.choices[0]?.message?.content || 
        "I'm here to listen and support you. Can you tell me more about how you're feeling?";

      console.log('✅ OpenAI response received');

      // Generate suggested replies based on the response
      const suggestedReplies = generateSuggestedReplies(botResponseText, message);

      const botMessage = {
        id: uuidv4(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        suggestedReplies
      };

      session.messages.push(botMessage);
      session.lastActivity = new Date();

      const finalResponse = {
        messages: [userMessage, botMessage],
        quickReplies: suggestedReplies,
        requiresCrisisPanel: false
      };

      console.log('✅ Message processed successfully');
      res.json(finalResponse);

    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      
      // Provide more detailed error handling
      let errorMessage = "I'm experiencing some technical difficulties right now, but I'm still here to support you. Can you tell me more about what's on your mind?";
      let suggestedReplies = [
        "I need someone to listen",
        "I'm feeling overwhelmed", 
        "Can you help me calm down?",
        "Let's try again"
      ];

      if (openaiError.code === 'insufficient_quota') {
        errorMessage = "I'm temporarily unable to provide AI responses due to service limits, but I'm still here for you. Please know that your feelings are valid and you're not alone.";
        suggestedReplies = [
          "I understand",
          "I need crisis resources",
          "Can you still help?",
          "What should I do?"
        ];
      } else if (openaiError.code === 'rate_limit_exceeded') {
        errorMessage = "I need a moment to process your message. Please try again in a few seconds. In the meantime, know that I'm here to support you.";
        suggestedReplies = [
          "I'll wait",
          "Try again",
          "I need immediate help",
          "Tell me more"
        ];
      }
      
      const fallbackMessage = {
        id: uuidv4(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        suggestedReplies
      };

      session.messages.push(fallbackMessage);
      session.lastActivity = new Date();

      const fallbackResponse = {
        messages: [userMessage, fallbackMessage],
        quickReplies: suggestedReplies,
        requiresCrisisPanel: false
      };

      console.log('🔄 Fallback response sent due to OpenAI error');
      res.json(fallbackResponse);
    }

  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: 'Please try sending your message again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate contextual suggested replies
const generateSuggestedReplies = (botResponse, userMessage) => {
  const lowerBotResponse = botResponse.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();

  // Context-based suggestions
  if (lowerBotResponse.includes('breathing') || lowerBotResponse.includes('breath')) {
    return [
      "Let's try the breathing exercise",
      "I'm ready to practice breathing",
      "Can you guide me through it?",
      "What other techniques can help?"
    ];
  }

  if (lowerBotResponse.includes('anxiety') || lowerUserMessage.includes('anxious')) {
    return [
      "Tell me more about managing anxiety",
      "I want to try a grounding technique",
      "How can I calm down right now?",
      "This is really helpful"
    ];
  }

  if (lowerBotResponse.includes('sleep') || lowerUserMessage.includes('sleep')) {
    return [
      "I have trouble falling asleep",
      "My mind races at bedtime",
      "Tell me about sleep hygiene",
      "Can we try a relaxation technique?"
    ];
  }

  if (lowerBotResponse.includes('professional') || lowerBotResponse.includes('therapist')) {
    return [
      "How do I find a good therapist?",
      "I'm not sure if I need professional help",
      "What should I expect in therapy?",
      "I'm ready to seek help"
    ];
  }

  if (lowerBotResponse.includes('crisis') || lowerBotResponse.includes('emergency')) {
    return [
      "I need immediate help",
      "Tell me about crisis resources",
      "I'm feeling better now",
      "Can someone talk to me?"
    ];
  }

  // Default suggestions
  return [
    "That makes sense",
    "Can you tell me more?",
    "I'd like to try that",
    "What else might help?"
  ];
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Chat session not found' 
      });
    }

    res.json({
      session: {
        id: session.id,
        userInfo: session.userInfo,
        messages: session.messages,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat history' 
    });
  }
};

// Get crisis resources
const getCrisisResources = async (req, res) => {
  try {
    const resources = [
      {
        id: 'suicide-lifeline',
        name: 'Suicide & Crisis Lifeline',
        phone: '988',
        description: '24/7 crisis support',
        type: 'crisis',
        priority: 'critical'
      },
      {
        id: 'emergency',
        name: 'Emergency Services',
        phone: '911',
        description: 'Immediate emergency help',
        type: 'emergency',
        priority: 'critical'
      },
      {
        id: 'crisis-text',
        name: 'Crisis Text Line',
        phone: '741741',
        description: 'Text HOME to 741741',
        type: 'text',
        priority: 'high'
      },
      {
        id: 'nami',
        name: 'NAMI Helpline',
        phone: '1-800-950-6264',
        description: 'Mental health support and resources',
        type: 'support',
        priority: 'medium'
      }
    ];

    res.json({ resources });
  } catch (error) {
    console.error('Error fetching crisis resources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crisis resources' 
    });
  }
};

// Clean up old sessions
const cleanupSessions = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [sessionId, session] of chatSessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      chatSessions.delete(sessionId);
      console.log(`🧹 Cleaned up inactive session: ${sessionId}`);
    }
  }
};

module.exports = {
  initializeChat,
  sendMessage,
  getChatHistory,
  getCrisisResources,
  cleanupSessions,
  chatSessions // Export for monitoring
};