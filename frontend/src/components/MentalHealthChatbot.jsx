import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, ChevronDown, X, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Backend configuration
  const BACKEND_URL = 'http://localhost:5000';
  const CHAT_ENDPOINT = '/api/chat';

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

  // Function to send message to backend
  const sendMessageToBackend = async (message) => {
    try {
      const response = await fetch(`${BACKEND_URL}${CHAT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || data.response || 'I hear you. Can you tell me more about what\'s on your mind?';
    } catch (error) {
      console.error('Error communicating with backend:', error);
      throw error;
    }
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
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Send message to backend
      const botResponseContent = await sendMessageToBackend(currentInput);
      
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: botResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      // Handle backend error
      setError('Unable to connect to the support system. Please try again.');
      
      // Fallback to local response
      const fallbackResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting right now. Your mental health is important - if you're in crisis, please reach out to the crisis resources above or contact emergency services.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
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

  const dismissError = () => {
    setError(null);
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
                  Bot is typing...
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