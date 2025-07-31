import React, { useState } from 'react';
import { MessageCircle, Phone, Shield, Heart } from 'lucide-react';

const ChatWindow = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  const handleStartChat = () => {
    setShowWelcome(false);
  };

  const handleBackToWelcome = () => {
    setShowWelcome(true);
  };

  return (
    <div className="chat-container">
      {/* Welcome Screen */}
      {showWelcome && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <header className="welcome-header">
              <Heart className="heart-icon" size={48} />
              <h1>Safe Space</h1>
              <p className="tagline">Your mental health matters. We're here to listen.</p>
            </header>

            <main className="welcome-main">
              {/* Value Proposition */}
              <section className="value-proposition">
                <h2>Professional Mental Health Support</h2>
                <p>
                  Connect with trained counselors and peer support specialists in a safe, 
                  judgment-free environment. Whether you're dealing with stress, anxiety, 
                  depression, or just need someone to talk to, we're here 24/7.
                </p>
              </section>

              {/* Crisis Resources */}
              <section className="crisis-resources">
                <h3>
                  <Phone size={20} />
                  Crisis Resources
                </h3>
                <div className="crisis-links">
                  <a href="tel:988" className="crisis-link">
                    <strong>988</strong> - Suicide & Crisis Lifeline
                  </a>
                  <a href="tel:741741" className="crisis-link">
                    <strong>741741</strong> - Crisis Text Line
                  </a>
                  <a href="tel:911" className="crisis-link emergency">
                    <strong>911</strong> - Emergency Services
                  </a>
                </div>
              </section>

              {/* Privacy Assurance */}
              <section className="privacy-assurance">
                <h3>
                  <Shield size={20} />
                  Your Privacy is Protected
                </h3>
                <p>
                  All conversations are confidential and encrypted. We follow strict HIPAA 
                  guidelines to ensure your personal information remains secure. You can 
                  chat anonymously or create an account - it's entirely your choice.
                </p>
              </section>

              {/* Call-to-Action */}
              <div className="cta-section">
                <button 
                  className="cta-button"
                  onClick={handleStartChat}
                  aria-label="Start confidential chat session"
                >
                  <MessageCircle size={20} />
                  Start Chat
                </button>
                <p className="cta-subtext">
                  Free, confidential, and available 24/7
                </p>
              </div>
            </main>

            <footer className="welcome-footer">
              <p>
                If you're experiencing a mental health emergency, please call 911 or 
                go to your nearest emergency room immediately.
              </p>
            </footer>
          </div>
        </div>
      )}

      {/* Message Display Area */}
      {!showWelcome && (
        <div className="message-display-area">
          <div className="chat-header">
            <button 
              className="back-button"
              onClick={handleBackToWelcome}
              aria-label="Go back to welcome screen"
            >
              ← Back
            </button>
            <h2>Chat Session</h2>
            <div className="status-indicator">
              <span className="status-dot"></span>
              Online
            </div>
          </div>
          
          <div className="messages-container">
            <div className="welcome-message">
              <div className="message-bubble counselor">
                <p>Hello! I'm here to listen and support you. How are you feeling today?</p>
                <small>Counselor • Just now</small>
              </div>
            </div>
            
            {/* This would be where actual messages would be displayed */}
            <div className="message-placeholder">
              <p>Messages will appear here...</p>
            </div>
          </div>
          
          <div className="message-input-area">
            <input 
              type="text" 
              placeholder="Type your message here..."
              className="message-input"
              aria-label="Type your message"
            />
            <button className="send-button" aria-label="Send message">
              Send
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .chat-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
          pointer-events: none;
        }

        .welcome-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        .welcome-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          max-width: 600px;
          width: 100%;
          text-align: center;
          color: white;
        }

        .welcome-header {
          margin-bottom: 2.5rem;
        }

        .heart-icon {
          color: #ff6b6b;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.3));
        }

        .welcome-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tagline {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 300;
        }

        .welcome-main {
          text-align: left;
        }

        .welcome-main section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .welcome-main h2 {
          font-size: 1.5rem;
          margin: 0 0 1rem 0;
          color: #f0f8ff;
        }

        .welcome-main h3 {
          font-size: 1.2rem;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #f0f8ff;
        }

        .welcome-main p {
          line-height: 1.6;
          margin: 0;
          opacity: 0.9;
        }

        .crisis-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .crisis-link {
          color: #87ceeb;
          text-decoration: none;
          padding: 0.5rem 0;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .crisis-link:hover {
          background: rgba(135, 206, 235, 0.1);
          transform: translateX(4px);
        }

        .crisis-link.emergency {
          color: #ff6b6b;
        }

        .cta-section {
          text-align: center;
          margin-top: 2rem;
        }

        .cta-button {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .cta-button:active {
          transform: translateY(0);
        }

        .cta-subtext {
          margin-top: 0.5rem;
          opacity: 0.8;
          font-size: 0.9rem;
        }

        .welcome-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
          opacity: 0.8;
          text-align: center;
        }

        .message-display-area {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .back-button {
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .messages-container {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .message-bubble {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-bubble.counselor {
          background: rgba(135, 206, 235, 0.2);
          border-color: rgba(135, 206, 235, 0.3);
        }

        .message-bubble p {
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
        }

        .message-bubble small {
          opacity: 0.7;
          font-size: 0.8rem;
        }

        .message-placeholder {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2rem;
        }

        .message-input-area {
          display: flex;
          gap: 1rem;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          backdrop-filter: blur(10px);
        }

        .message-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .message-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
        }

        .send-button {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .send-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }

        @media (max-width: 768px) {
          .welcome-content {
            padding: 2rem;
            margin: 1rem;
          }
          
          .welcome-header h1 {
            font-size: 2rem;
          }
          
          .crisis-links {
            gap: 0.3rem;
          }
          
          .chat-header {
            padding: 1rem;
          }
          
          .messages-container {
            padding: 1rem;
          }
          
          .message-input-area {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .welcome-content {
            padding: 1.5rem;
          }
          
          .welcome-main section {
            padding: 1rem;
          }
          
          .cta-button {
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;