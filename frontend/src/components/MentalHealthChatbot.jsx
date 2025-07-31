import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/mentalchatbot.module.css';
import { 
  Send, 
  Phone, 
  AlertCircle, 
  MessageCircle, 
  Heart, 
  Smile, 
  Meh, 
  Frown,
  Wind,
  Brain,
  BookOpen,
  Clock,
  User,
  Bot,
  X,
  Loader2
} from 'lucide-react';

const MentalHealthChatbot = () => {
  const [showPreChat, setShowPreChat] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: '',
    mood: '',
    supportType: ''
  });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisPanel, setShowCrisisPanel] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [quickReplies, setQuickReplies] = useState([]);
  const [error, setError] = useState(null);
  const [crisisResources, setCrisisResources] = useState([]);
  const messagesEndRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const defaultQuickReplies = [
    { text: "I'm feeling anxious", icon: <AlertCircle size={16} /> },
    { text: "Can we do a breathing exercise?", icon: <Wind size={16} /> },
    { text: "I need coping strategies", icon: <Brain size={16} /> },
    { text: "Tell me about mindfulness", icon: <Heart size={16} /> },
    { text: "I'm having trouble sleeping", icon: <Clock size={16} /> },
    { text: "Share some resources", icon: <BookOpen size={16} /> }
  ];

  const moodOptions = [
    { value: 'great', label: 'Great', icon: <Smile size={20} />, color: 'var(--mood-great)' },
    { value: 'okay', label: 'Okay', icon: <Meh size={20} />, color: 'var(--mood-okay)' },
    { value: 'struggling', label: 'Struggling', icon: <Frown size={20} />, color: 'var(--mood-struggling)' }
  ];

  const supportTypes = [
    { value: 'chat', label: 'Just want to chat' },
    { value: 'resources', label: 'Looking for resources' },
    { value: 'exercises', label: 'Want guided exercises' },
    { value: 'crisis', label: 'In crisis - need immediate help' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showCrisisPanel) {
      fetchCrisisResources();
    }
  }, [showCrisisPanel]);

  const handleApiError = (error) => {
    console.error('API Error:', error);
    setError('Unable to connect to the support server. Please try again.');
    setIsLoading(false);
    setIsTyping(false);
  };

  const fetchCrisisResources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crisis-resources`);
      if (response.ok) {
        const data = await response.json();
        setCrisisResources(data.resources);
      }
    } catch (error) {
      console.error('Error fetching crisis resources:', error);
    }
  };

  const initializeChat = async (userInfo) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/chat/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInfo }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      const data = await response.json();
      
      setSessionId(data.sessionId);
      setMessages(data.messages);
      setQuickReplies(data.quickReplies || defaultQuickReplies);
      
      if (data.requiresCrisisPanel) {
        setShowCrisisPanel(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!sessionId) {
      setError('Chat session not initialized. Please refresh and try again.');
      return;
    }

    try {
      setIsTyping(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, ...data.messages]);
      
      if (data.requiresCrisisPanel) {
        setShowCrisisPanel(true);
      }
      
      if (data.quickReplies) {
        setQuickReplies(data.quickReplies.map(reply => ({
          text: reply,
          icon: <MessageCircle size={16} />
        })));
      }
      
      setIsTyping(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handlePreChatSubmit = async () => {
    if (!userInfo.supportType) return;
    setShowPreChat(false);
    await initializeChat(userInfo);
  };

  const handleSendMessage = (messageText = null) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    setInputMessage('');
    sendMessage(text);
  };

  const handleQuickReply = (text) => {
    handleSendMessage(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (showPreChat) {
    return (
      <div className={styles['chatbot-gradient-bg']}>
        {/* Animated background elements */}
        <div className={styles['animated-bg-element']}></div>
        <div className={styles['animated-bg-element']}></div>
        <div className={styles['animated-bg-element']}></div>

        <div className={styles['pre-chat-container']}>
          <div className={styles['pre-chat-content']}>
            <div className={styles['pre-chat-header']}>
              <Heart className={styles['heart-icon']} size={48} />
              <h1>Welcome to Mental Health Support</h1>
              <p>Let's personalize your experience to better support you</p>
            </div>

            <form className={styles['pre-chat-form']}>
              <div className={styles['form-group']}>
                <label>
                  <User size={20} />
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                  placeholder="How would you like to be addressed?"
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-group']}>
                <label>
                  <Heart size={20} />
                  How are you feeling today?
                </label>
                <div className={styles['mood-selector']}>
                  {moodOptions.map(mood => (
                    <button
                      key={mood.value}
                      type="button"
                      className={`${styles['mood-option']} ${userInfo.mood === mood.value ? styles['selected'] : ''}`}
                      style={{ '--mood-color': mood.color }}
                      onClick={() => setUserInfo({...userInfo, mood: mood.value})}
                    >
                      <div style={{ color: mood.color }}>{mood.icon}</div>
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['form-group']}>
                <label>
                  <MessageCircle size={20} />
                  What kind of support are you looking for?
                </label>
                <select
                  value={userInfo.supportType}
                  onChange={(e) => setUserInfo({...userInfo, supportType: e.target.value})}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Select support type...</option>
                  {supportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="button" 
                onClick={handlePreChatSubmit}
                className={styles['start-chat-button']}
                disabled={isLoading || !userInfo.supportType}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={styles['loading-spinner']} size={20} />
                    Connecting...
                  </>
                ) : (
                  <>
                    Start Chat
                    <MessageCircle size={20} />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className={styles['error-message']}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className={styles['pre-chat-footer']}>
              <p>
                <AlertCircle size={16} />
                If you're in crisis, please call 911 or the 988 Suicide & Crisis Lifeline immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['chat-layout']}>
      {/* Crisis Panel */}
      {showCrisisPanel && (
        <div className={`${styles['crisis-panel']} ${styles['visible']}`}>
          <div className={styles['crisis-header']}>
            <AlertCircle size={20} />
            <h3>Crisis Support</h3>
            <button
              onClick={() => setShowCrisisPanel(false)}
              className={styles['close-panel']}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className={styles['crisis-links']}>
            <a href="tel:988" className={`${styles['crisis-link']} ${styles['primary']}`}>
              <Phone size={20} />
              <div>
                <strong>988 Suicide & Crisis Lifeline</strong>
                <span>24/7 confidential support</span>
              </div>
            </a>
            <a href="tel:911" className={`${styles['crisis-link']} ${styles['emergency']}`}>
              <Phone size={20} />
              <div>
                <strong>Emergency Services</strong>
                <span>Call 911 for immediate help</span>
              </div>
            </a>
          </div>
          
          <p className={styles['crisis-note']}>
            Your safety is our priority. Please reach out for immediate help if needed.
          </p>
        </div>
      )}

      {/* Main Chat */}
      <div className={styles['chat-main']}>
        <div className={styles['chat-header']}>
          <div className={styles['chat-title']}>
            <Bot size={24} />
            <h2>Mental Health Support</h2>
          </div>
          <button
            onClick={() => setShowCrisisPanel(!showCrisisPanel)}
            className={styles['crisis-toggle']}
          >
            <AlertCircle size={16} />
            Crisis Help
          </button>
        </div>

        <div className={styles['messages-container']}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles['message']} ${styles[message.sender]}`}
            >
              <div className={styles['message-avatar']}>
                {message.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={styles['message-content']}>
                <div className={styles['message-bubble']}>
                  <p>{message.text}</p>
                </div>
                <div className={styles['message-time']}>
                  <Clock size={12} />
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className={`${styles['message']} ${styles['bot']}`}>
              <div className={styles['message-avatar']}>
                <Bot size={20} />
              </div>
              <div className={styles['message-content']}>
                <div className={styles['message-bubble']}>
                  <div className={styles['typing-dots']}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <div className={styles['quick-replies']}>
            <div className={styles['quick-replies-container']}>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply.text)}
                  className={styles['quick-reply']}
                >
                  {reply.icon}
                  {reply.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={styles['message-input-area']}>
          {error && (
            <div className={styles['error-message']}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className={styles['message-input']}
            disabled={isTyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className={styles['send-button']}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthChatbot;