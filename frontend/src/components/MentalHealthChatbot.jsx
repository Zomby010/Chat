import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, ChevronDown, X } from 'lucide-react';

const MentalHealthChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm here to listen and support you. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisDropdown, setShowCrisisDropdown] = useState(false);
  const [currentMood, setCurrentMood] = useState({ emoji: '😊', label: 'Feeling Good' });
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Encouragement messages
  const encouragementMessages = [
    "You are not alone in this journey",
    "Today is a new chance to heal",
    "Your feelings are valid and important",
    "Small steps forward are still progress",
    "You have the strength within you",
    "It's okay to not be okay today",
    "You matter more than you know",
    "Healing is not linear, and that's okay",
    "You are worthy of love and support",
    "Tomorrow can be different from today"
  ];

  // Set random encouragement message on component mount
  useEffect(() => {
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    setEncouragementMessage(randomMessage);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate bot response (replace with actual AI integration)
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: generateBotResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateBotResponse = (userInput) => {
    // Simple response logic - replace with actual AI integration
   const responses = [
  "I hear you. It takes courage to share your feelings. Can you tell me more about what's on your mind?",
  "Thank you for opening up. Your feelings are completely valid. What would help you feel more supported right now?",
  "That sounds really difficult. Remember, it's okay to feel this way. Have you been able to talk to anyone else about this?",
  "I'm glad you're reaching out. Taking care of your mental health is so important. What's one small thing that usually makes you feel a little better?",
  "Your strength in reaching out shows how much you care about yourself. What would you like to focus on in our conversation today?",
  "I can tell this is really weighing on you. Would it help to talk through what's been on your mind lately?",
  "You're doing the right thing by reaching out. Let's take a moment to breathe together—would that feel supportive right now?",
  "That sounds like a lot to handle. Have you noticed any small moments of relief, even briefly?",
  "Your feelings make so much sense given what you're going through. What do you wish others understood about this?",
  "It's okay to not have all the answers. Would it help to explore this step by step?",
  "I'm here to listen without judgment. What's one thing you'd like to feel differently about this situation?",
  "You're not alone in this. Many people find it helpful to name their emotions—how would you describe yours?",
  "It takes strength to acknowledge these feelings. What's something that's helped you cope in the past?",
  "I hear how difficult this is for you. What would support look like for you today?",
  "This sounds deeply painful. Would you like to focus on problem-solving, or just feel heard for now?",
  "Your honesty is so important. Let's slow down—what's coming up for you as we talk about this?",
  "I'm glad you're sharing this with me. What's one thing that usually brings you comfort, even a little?",
  "That sounds exhausting to carry. How can I help you feel grounded in this moment?",
  "You deserve kindness right now. Is there a part of this that feels easier to talk about first?",
  "I can sense how much this matters to you. What's a small step that might ease the pressure?",
  "It's okay to feel this way. Have you found anything that helps when things feel this heavy?",
  "Thank you for trusting me with this. What would make this conversation feel most helpful for you?",
  "I'm holding space for you. Would it help to pause and take three deep breaths together?",
  "This sounds like it's been really hard. What's something you'd tell a friend going through the same thing?",
  "You're not failing—you're feeling. What do you need most from me right now?",
  "I hear how much this is affecting you. What's one thing you'd like to feel differently by the end of our chat?",
  "Your emotions are valid, even if they're complicated. Would it help to talk about what's underneath this?",
  "It's brave to sit with these feelings. What's a tiny act of self-care you could try today?",
  "I'm here to walk through this with you. What's on your mind in this very moment?",
  "That sounds overwhelming. Let's break it down—what's one part of this you'd like to focus on?",
  "You're allowed to feel this way. What's something kind you could do for yourself right now?",
  "I'm listening closely. What's a word or image that captures how you're feeling?",
  "This matters. Would it help to imagine what relief might look like, even just a little?",
  "You're not broken—you're responding to real challenges. What's one thing that usually helps you recharge?",
  "Let's honor what you're feeling. What's a next step that feels manageable today?",
  "I'm with you in this. What's something you'd like to remind yourself of right now?"
];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '80%',
        maxWidth: '800px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{currentMood.emoji}</span>
            <span>{currentMood.label}</span>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCrisisDropdown(!showCrisisDropdown)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              🆘
            </button>
            
            {showCrisisDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '16px',
                minWidth: '280px',
                zIndex: 1000,
                color: '#333'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: '#e74c3c',
                    fontSize: '14px'
                  }}>
                    Crisis Resources
                  </h4>
                  <button
                    onClick={() => setShowCrisisDropdown(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <a href="tel:988" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    textDecoration: 'none',
                    color: '#333'
                  }}>
                    <strong style={{ fontSize: '14px', marginBottom: '2px' }}>988</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>Suicide & Crisis Lifeline</span>
                  </a>
                  
                  <a href="tel:741741" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    textDecoration: 'none',
                    color: '#333'
                  }}>
                    <strong style={{ fontSize: '14px', marginBottom: '2px' }}>741741</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>Crisis Text Line</span>
                  </a>
                  
                  <a href="tel:911" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    textDecoration: 'none',
                    color: '#e74c3c'
                  }}>
                    <strong style={{ fontSize: '14px', marginBottom: '2px' }}>911</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>Emergency Services</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Encouragement Box */}
        <div style={{
          background: 'linear-gradient(45deg, #ffeaa7, #fab1a0)',
          padding: '12px 20px',
          textAlign: 'center',
          borderBottom: '1px solid #eee'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#2d3436',
            fontStyle: 'italic'
          }}>
            💙 {encouragementMessage}
          </p>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#f8f9fa'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: message.type === 'user' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: message.type === 'user' ? 'white' : '#333',
                border: message.type === 'bot' ? '1px solid #e0e0e0' : 'none',
                borderBottomRightRadius: message.type === 'user' ? '4px' : '18px',
                borderBottomLeftRadius: message.type === 'bot' ? '4px' : '18px'
              }}>
                <p style={{
                  margin: 0,
                  lineHeight: 1.4,
                  fontSize: '14px'
                }}>
                  {message.content}
                </p>
                <span style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: 'white',
                color: '#333',
                border: '1px solid #e0e0e0',
                borderBottomLeftRadius: '4px'
              }}>
                <p style={{
                  margin: 0,
                  lineHeight: 1.4,
                  fontSize: '14px',
                  opacity: 0.7
                }}>
                  Typing...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          display: 'flex',
          padding: '16px 20px',
          background: 'white',
          borderTop: '1px solid #eee',
          gap: '12px'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '24px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '12px 24px',
              background: (!inputMessage.trim() || isLoading) 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!(!inputMessage.trim() || isLoading)) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthChatbot;