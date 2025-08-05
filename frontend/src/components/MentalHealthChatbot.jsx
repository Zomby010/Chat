import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, ChevronDown, X, AlertCircle } from 'lucide-react';

const MentalHealthChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisDropdown, setShowCrisisDropdown] = useState(false);
  const [currentMood, setCurrentMood] = useState({ emoji: '😊', label: 'Feeling Good' });
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [requiresCrisisPanel, setRequiresCrisisPanel] = useState(false);
  const messagesEndRef = useRef(null);

  // Backend configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  // Initialize chat session when component mounts
  useEffect(() => {
    initializeChat();
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    setEncouragementMessage(randomMessage);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show crisis panel when required
  useEffect(() => {
    if (requiresCrisisPanel) {
      setShowCrisisDropdown(true);
    }
  }, [requiresCrisisPanel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize chat session with backend
  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/chat/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo: {
            name: null, // Can be set from user input later
            mood: currentMood.label,
            supportType: 'general'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Set session data
      setSessionId(data.sessionId);
      setMessages(data.messages || []);
      setQuickReplies(data.quickReplies || []);
      setRequiresCrisisPanel(data.requiresCrisisPanel || false);
      setIsInitialized(true);

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Unable to connect to the support system. Please check your connection and try again.');
      
      // Fallback initialization
      setMessages([{
        id: 'fallback-1',
        text: "Hello! I'm here to support you, but I'm having trouble connecting to our main system. I can still help you with basic support. How are you feeling today?",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }]);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to backend
  const sendMessageToBackend = async (message) => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setQuickReplies([]); // Clear previous quick replies

    try {
      if (sessionId) {
        // Send to backend
        const data = await sendMessageToBackend(messageText);
        
        // Backend returns an array of messages (user message + bot response)
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(prev => [...prev, ...data.messages]);
        }
        
        // Handle additional response data
        setQuickReplies(data.quickReplies || []);
        setRequiresCrisisPanel(data.requiresCrisisPanel || false);
        
      } else {
        // Fallback handling when no session
        const userMessage = {
          id: `user-${Date.now()}`,
          text: messageText,
          sender: 'user',
          timestamp: new Date().toISOString()
        };

        const botResponse = {
          id: `bot-${Date.now()}`,
          text: "I hear you. While I'm having connection issues, please know that your feelings are valid. If you're in crisis, please use the emergency resources above.",
          sender: 'bot',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage, botResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error and create fallback messages
      setError('Unable to send message. Please try again.');
      
      const userMessage = {
        id: `user-${Date.now()}`,
        text: messageText,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      const errorResponse = {
        id: `bot-error-${Date.now()}`,
        text: "I apologize, but I'm having trouble connecting right now. Your mental health is important - if you're in crisis, please reach out to the crisis resources or contact emergency services.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    setQuickReplies([]);
  };

  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
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

  const dismissError = () => {
    setError(null);
  };

  // Show loading state during initialization
  if (!isInitialized) {
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
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🤗</div>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Connecting to Support...</h3>
          <p style={{ margin: 0, color: '#666' }}>Setting up your safe space</p>
        </div>
      </div>
    );
  }

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
            {sessionId && (
              <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: '8px' }}>
                • Connected
              </span>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCrisisDropdown(!showCrisisDropdown)}
              style={{
                background: requiresCrisisPanel 
                  ? 'rgba(231, 76, 60, 0.8)' 
                  : 'rgba(255, 255, 255, 0.2)',
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
                color: 'white',
                animation: requiresCrisisPanel ? 'pulse 2s infinite' : 'none'
              }}
              onMouseOver={(e) => {
                e.target.style.background = requiresCrisisPanel 
                  ? 'rgba(231, 76, 60, 1)' 
                  : 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = requiresCrisisPanel 
                  ? 'rgba(231, 76, 60, 0.8)' 
                  : 'rgba(255, 255, 255, 0.2)';
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
                    🚨 Crisis Resources
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
                    <span style={{ fontSize: '12px', color: '#666' }}>Suicide & Crisis Lifeline (24/7)</span>
                  </a>
                  
                  <a href="sms:741741?body=HOME" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    textDecoration: 'none',
                    color: '#333'
                  }}>
                    <strong style={{ fontSize: '14px', marginBottom: '2px' }}>Text HOME to 741741</strong>
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

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee',
            padding: '12px 20px',
            borderBottom: '1px solid #fcc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#d32f2f'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '14px' }}>{error}</span>
            </div>
            <button
              onClick={dismissError}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#d32f2f'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

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
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: message.sender === 'user' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: message.sender === 'user' ? 'white' : '#333',
                border: message.sender === 'bot' ? '1px solid #e0e0e0' : 'none',
                borderBottomRightRadius: message.sender === 'user' ? '4px' : '18px',
                borderBottomLeftRadius: message.sender === 'bot' ? '4px' : '18px'
              }}>
                <p style={{
                  margin: 0,
                  lineHeight: 1.4,
                  fontSize: '14px'
                }}>
                  {message.text || message.content}
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
                  Support assistant is typing...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <div style={{
            padding: '12px 20px',
            background: '#f8f9fa',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#333';
                }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

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

        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default MentalHealthChatbot;