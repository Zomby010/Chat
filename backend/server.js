const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for chat sessions
const chatSessions = new Map();

// Mental health bot response logic
const generateBotResponse = (userMessage, userInfo = null) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Crisis detection
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'harm myself'];
  const isCrisis = crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isCrisis) {
    return {
      text: "I'm very concerned about what you're sharing. Please reach out for immediate help: Call 988 (Suicide & Crisis Lifeline) or 911 if you're in immediate danger. You're not alone, and there are people who want to help you.",
      requiresCrisisPanel: true,
      priority: 'high'
    };
  }
  
  // Contextual responses based on user message
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return {
      text: "I hear that you're feeling anxious. That's a very common experience, and I'm here to help. Would you like to try a quick breathing exercise, or would you prefer to talk about what's making you feel this way?",
      suggestedReplies: [
        "Let's try a breathing exercise",
        "I want to talk about what's causing my anxiety",
        "Tell me more about anxiety coping strategies"
      ]
    };
  }
  
  if (lowerMessage.includes('breathing') || lowerMessage.includes('exercise')) {
    return {
      text: "Let's do a simple breathing exercise together. Find a comfortable position and follow along:\n\n1. Breathe in slowly for 4 counts... hold for 4... and breathe out for 6.\n2. Let's repeat this a few times.\n3. Focus on the rhythm of your breath.\n\nTake your time with each breath. How are you feeling as we do this?",
      suggestedReplies: [
        "I'm feeling calmer",
        "Can we try a different technique?",
        "This is helping, thank you"
      ]
    };
  }
  
  if (lowerMessage.includes('sleep') || lowerMessage.includes('sleeping') || lowerMessage.includes('insomnia')) {
    return {
      text: "Sleep troubles can really affect how we feel. Some gentle strategies that might help include:\n\n• Keeping a consistent bedtime routine\n• Avoiding screens 1 hour before bed\n• Creating a calm environment\n• Trying relaxation techniques like progressive muscle relaxation\n\nWhat's your current sleep routine like? Are there specific things that seem to keep you awake?",
      suggestedReplies: [
        "I have trouble falling asleep",
        "I wake up frequently during the night",
        "My mind races when I try to sleep"
      ]
    };
  }
  
  if (lowerMessage.includes('coping') || lowerMessage.includes('strategies')) {
    return {
      text: "Here are some evidence-based coping strategies that many people find helpful:\n\n• **Grounding techniques** - Like the 5-4-3-2-1 method (5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste)\n• **Deep breathing** - Slow, intentional breathing to activate your parasympathetic nervous system\n• **Gentle movement** - Walking, stretching, or light exercise\n• **Journaling** - Writing down thoughts and feelings\n• **Reaching out** - Connecting with someone you trust\n\nWhich of these resonates with you, or would you like to learn more about any specific technique?",
      suggestedReplies: [
        "Tell me about grounding techniques",
        "I'd like to try journaling",
        "How can gentle movement help?"
      ]
    };
  }
  
  if (lowerMessage.includes('mindfulness') || lowerMessage.includes('meditation')) {
    return {
      text: "Mindfulness is about being present in the moment without judgment. It's a powerful tool for managing stress and anxiety.\n\nA simple way to start:\n• Focus on your breath naturally flowing in and out\n• When your mind wanders (and it will!), gently bring attention back to your breath\n• Try a quick body scan - notice how your body feels right now, starting from your toes and moving up\n\nWhat do you notice about your body and breath right now?",
      suggestedReplies: [
        "I notice tension in my shoulders",
        "My breathing feels shallow",
        "Can you guide me through a body scan?"
      ]
    };
  }
  
  if (lowerMessage.includes('depressed') || lowerMessage.includes('depression') || lowerMessage.includes('sad')) {
    return {
      text: "I'm sorry you're feeling this way. Depression can make everything feel overwhelming and exhausting. Please know that what you're experiencing is real and valid, and it's brave of you to reach out.\n\nSome gentle reminders:\n• Depression is treatable\n• Small steps count\n• You don't have to go through this alone\n• Professional help can make a real difference\n\nWould you like to talk about what's been weighing on you, or would you prefer some gentle coping strategies for right now?",
      suggestedReplies: [
        "I want to talk about what I'm going through",
        "I need some immediate coping strategies",
        "How do I find professional help?"
      ]
    };
  }
  
  if (lowerMessage.includes('resources') || lowerMessage.includes('help')) {
    return {
      text: "I'd be happy to share some resources with you. Here are some reliable mental health resources:\n\n**Crisis Support:**\n• 988 - Suicide & Crisis Lifeline (24/7)\n• 741741 - Crisis Text Line\n• 911 - Emergency services\n\n**Apps & Tools:**\n• Headspace, Calm - for meditation\n• Sanvello, MindShift - for anxiety\n• Daylio - for mood tracking\n\n**Professional Help:**\n• Psychology Today - therapist finder\n• BetterHelp, Talkspace - online therapy\n• Your healthcare provider\n\nWhat type of support are you most interested in exploring?",
      suggestedReplies: [
        "I want to find a therapist",
        "Tell me about helpful apps",
        "How do I know if I need professional help?"
      ]
    };
  }
  
  if (lowerMessage.includes('panic') || lowerMessage.includes('panic attack')) {
    return {
      text: "Panic attacks can be very frightening, but they will pass. Here's a technique you can try right now:\n\n**5-4-3-2-1 Grounding:**\n• Name 5 things you can see\n• 4 things you can touch\n• 3 things you can hear\n• 2 things you can smell\n• 1 thing you can taste\n\nRemember: You are safe. This feeling will pass. Focus on your breathing - in for 4, hold for 4, out for 6.\n\nHow are you feeling right now?",
      suggestedReplies: [
        "I'm trying the grounding technique",
        "The panic is starting to subside",
        "Can you help me understand panic attacks better?"
      ]
    };
  }
  
  // Default supportive response
  return {
    text: "Thank you for sharing that with me. I'm here to listen and support you. It takes courage to reach out, and I want you to know that your feelings are valid.\n\nCan you tell me more about how you're feeling right now, or is there something specific you'd like help with today?",
    suggestedReplies: [
      "I'm feeling anxious",
      "I'm having trouble sleeping",
      "I need coping strategies",
      "I want to talk about what's bothering me"
    ]
  };
};

// Generate quick reply options based on context
const getQuickReplies = (userInfo = null) => {
  const baseReplies = [
    { text: "I'm feeling anxious", category: "anxiety" },
    { text: "Can we do a breathing exercise?", category: "exercise" },
    { text: "I need coping strategies", category: "coping" },
    { text: "Tell me about mindfulness", category: "mindfulness" },
    { text: "I'm having trouble sleeping", category: "sleep" },
    { text: "Share some resources", category: "resources" }
  ];
  
  // Add personalized replies based on user info
  if (userInfo?.mood === 'struggling') {
    baseReplies.unshift({ text: "I need immediate support", category: "crisis" });
  }
  
  return baseReplies;
};

// API Routes

// Initialize chat session
app.post('/api/chat/init', (req, res) => {
  try {
    const { userInfo } = req.body;
    const sessionId = uuidv4();
    
    // Create new chat session
    const session = {
      id: sessionId,
      userInfo,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    // Generate welcome message based on user info
    const welcomeMessage = {
      id: uuidv4(),
      text: userInfo?.name 
        ? `Hello ${userInfo.name}! I'm here to support you. How can I help you today?`
        : "Hello! I'm here to support you. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      suggestedReplies: getQuickReplies(userInfo)
    };
    
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
    
    res.json({
      sessionId,
      messages: session.messages,
      requiresCrisisPanel,
      quickReplies: getQuickReplies(userInfo)
    });
  } catch (error) {
    console.error('Error initializing chat:', error);
    res.status(500).json({ error: 'Failed to initialize chat session' });
  }
});

// Send message
app.post('/api/chat/message', (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    session.messages.push(userMessage);
    
    // Generate bot response
    const botResponseData = generateBotResponse(message, session.userInfo);
    
    // Add bot message
    const botMessage = {
      id: uuidv4(),
      text: botResponseData.text,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      suggestedReplies: botResponseData.suggestedReplies,
      priority: botResponseData.priority
    };
    
    session.messages.push(botMessage);
    session.lastActivity = new Date();
    
    res.json({
      messages: [userMessage, botMessage],
      requiresCrisisPanel: botResponseData.requiresCrisisPanel || false,
      quickReplies: botResponseData.suggestedReplies || getQuickReplies(session.userInfo)
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat history
app.get('/api/chat/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
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
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get crisis resources
app.get('/api/crisis-resources', (req, res) => {
  try {
    const resources = [
      {
        id: 'suicide-lifeline',
        name: 'Suicide & Crisis Lifeline',
        phone: '988',
        description: '24/7 crisis support',
        type: 'crisis',
        priority: 'high'
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
    res.status(500).json({ error: 'Failed to fetch crisis resources' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeSessions: chatSessions.size
  });
});

// Clean up old sessions (run every hour)
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [sessionId, session] of chatSessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      chatSessions.delete(sessionId);
      console.log(`Cleaned up inactive session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // 1 hour

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mental Health Support Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;