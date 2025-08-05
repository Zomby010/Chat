import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Phone, 
  Shield, 
  Heart, 
  ChevronDown, 
  X,
  User,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [showCrisisDropdown, setShowCrisisDropdown] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('ready');
  const [breathingCount, setBreathingCount] = useState(0);
  const [encouragementMessage, setEncouragementMessage] = useState('');

  // Encouragement messages that change on each render
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

  // Mood options with emojis
  const moodOptions = [
    { emoji: '😢', label: 'Very Sad', value: 1 },
    { emoji: '😔', label: 'Sad', value: 2 },
    { emoji: '😐', label: 'Not Great', value: 3 },
    { emoji: '😕', label: 'Okay', value: 4 },
    { emoji: '🙂', label: 'Fine', value: 5 },
    { emoji: '😊', label: 'Good', value: 6 },
    { emoji: '😄', label: 'Great', value: 7 },
    { emoji: '😁', label: 'Very Good', value: 8 },
    { emoji: '🤗', label: 'Excellent', value: 9 },
    { emoji: '😍', label: 'Amazing', value: 10 }
  ];

  const handleStartChat = () => {
    navigate('/chat');
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    // You can save this mood data to your state management or API
    console.log('Selected mood:', mood);
    setShowMoodModal(false);
  };

  const handleBreathingExercise = () => {
    if (isBreathing) return;
    
    setIsBreathing(true);
    setBreathingPhase('inhale');
    setBreathingCount(0);
    
    const breathingCycle = () => {
      let count = 0;
      const totalCycles = 5; // 30 seconds / 6 seconds per cycle = 5 cycles
      
      const cycle = () => {
        if (count >= totalCycles) {
          setIsBreathing(false);
          setBreathingPhase('ready');
          setBreathingCount(0);
          return;
        }
        
        // Inhale phase (4 seconds)
        setBreathingPhase('inhale');
        setTimeout(() => {
          // Hold phase (2 seconds)
          setBreathingPhase('hold');
          setTimeout(() => {
            // Exhale phase (4 seconds)
            setBreathingPhase('exhale');
            setTimeout(() => {
              count++;
              setBreathingCount(count);
              cycle();
            }, 4000);
          }, 2000);
        }, 4000);
      };
      
      cycle();
    };
    
    breathingCycle();
  };

  const getBreathingText = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      default: return 'Tap to Breathe';
    }
  };

  return (
    <div className="welcome-screen">
      {/* Top Message */}
      <header className="welcome-header">
        <div className="brand-section">
          <Heart className="heart-icon" size={48} />
          <h1 className="brand-title">Safe Space</h1>
        </div>
        <p className="tagline">Your mental health matters. We're here to listen.</p>
      </header>

      {/* Main Content Grid */}
      <main className="welcome-main">
        {/* Encouragement Box */}
        <section className="encouragement-box">
          <div className="encouragement-content">
            <h2 className="encouragement-title">💙 Daily Encouragement</h2>
            <p className="encouragement-text">{encouragementMessage}</p>
          </div>
        </section>

        {/* Start Chat Button - Prominent */}
        <section className="start-chat-section">
          <button 
            className="start-chat-button"
            onClick={handleStartChat}
            aria-label="Start confidential chat session"
          >
            <MessageCircle size={24} />
            Start Chat
          </button>
          <p className="chat-subtext">Free, confidential, and available 24/7</p>
        </section>

        {/* Interactive Features Grid */}
        <div className="features-grid">
          {/* Mood Check-in */}
          <section className="feature-card mood-checkin">
            <h3>Mood Check-in</h3>
            <button 
              className="feature-button mood-button"
              onClick={() => setShowMoodModal(true)}
            >
              How are you feeling today?
            </button>
            {selectedMood && (
              <div className="selected-mood">
                <span>Last mood: {selectedMood.emoji} {selectedMood.label}</span>
              </div>
            )}
          </section>

          {/* Crisis Resources */}
          <section className="feature-card crisis-resources">
            <h3>Crisis Resources</h3>
            <div className="crisis-dropdown-container">
              <button 
                className="feature-button crisis-button"
                onClick={() => setShowCrisisDropdown(!showCrisisDropdown)}
              >
                <Phone size={20} />
                Crisis Resources
                <ChevronDown size={16} className={showCrisisDropdown ? 'rotated' : ''} />
              </button>
              {showCrisisDropdown && (
                <div className="crisis-dropdown">
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
              )}
            </div>
          </section>

          {/* Breathing Exercise */}
          <section className="feature-card breathing-exercise">
            <h3>Breathing Guide</h3>
            <div className="breathing-container">
              <button 
                className={`breathing-circle ${breathingPhase}`}
                onClick={handleBreathingExercise}
                disabled={isBreathing}
              >
                <span className="breathing-text">{getBreathingText()}</span>
                {isBreathing && (
                  <div className="breathing-progress">
                    {breathingCount}/5
                  </div>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Large Encouragement Message Section */}
        <section className="large-encouragement">
          <div className="encouragement-hero">
            <h2 className="hero-message">You're stronger than you think</h2>
            <p className="hero-subtext">
              Every step you take towards mental wellness is an act of courage. 
              You have the power to heal, grow, and create positive change in your life.
            </p>
          </div>
        </section>

        {/* Professional Integration Section */}
        <section className="professional-integration">
          <h2 className="section-title">
            <UserCheck size={24} />
            Professional Support Integration
          </h2>
          <div className="integration-grid">
            <div className="integration-card">
              <User size={20} />
              <h3>Therapist Referrals</h3>
              <p>Connect with licensed mental health professionals in your area</p>
            </div>
            <div className="integration-card">
              <Shield size={20} />
              <h3>Share with Providers</h3>
              <p>Securely share chat summaries with your healthcare team</p>
            </div>
            <div className="integration-card">
              <ExternalLink size={20} />
              <h3>Human Support</h3>
              <p>Escalate to trained counselors when you need additional help</p>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="privacy-section">
          <div className="privacy-content">
            <Shield size={24} className="privacy-icon" />
            <h3>Your Privacy is Protected</h3>
            <p>
              All conversations are confidential and encrypted. We follow strict HIPAA 
              guidelines to ensure your personal information remains secure.
            </p>
          </div>
        </section>
      </main>

      {/* Mood Selection Modal */}
      {showMoodModal && (
        <div className="modal-overlay" onClick={() => setShowMoodModal(false)}>
          <div className="mood-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>How are you feeling today?</h3>
              <button 
                className="close-button"
                onClick={() => setShowMoodModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mood-grid">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  className="mood-option"
                  onClick={() => handleMoodSelect(mood)}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="welcome-footer">
        <p>
          If you're experiencing a mental health emergency, please call 911 or 
          go to your nearest emergency room immediately.
        </p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;