import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause
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
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for breathing control
  const breathingIntervalRef = useRef(null);
  const breathingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

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

  // Enhanced breathing timing configuration
  const breathingConfig = {
    inhaleTime: 4000,    // 4 seconds inhale
    holdTime: 2000,      // 2 seconds hold
    exhaleTime: 6000,    // 6 seconds exhale
    totalCycles: 3,      // 3 cycles for 30 seconds total
    progressUpdateInterval: 50 // Update progress every 50ms for smooth animation
  };

  // Ambient sound generation for breathing
  const createAmbientSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create calming frequency based on breathing phase
      const getFrequency = (phase) => {
        switch (phase) {
          case 'inhale': return 220; // A3 note
          case 'hold': return 261.63; // C4 note
          case 'exhale': return 196; // G3 note
          default: return 220;
        }
      };
      
      oscillator.frequency.setValueAtTime(getFrequency(breathingPhase), audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillatorRef.current = oscillator;
      
      // Fade out after phase
      const phaseDuration = breathingPhase === 'inhale' ? breathingConfig.inhaleTime :
                           breathingPhase === 'hold' ? breathingConfig.holdTime :
                           breathingConfig.exhaleTime;
      
      setTimeout(() => {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        setTimeout(() => oscillator.stop(), 500);
      }, phaseDuration - 500);
      
    } catch (error) {
      console.log('Audio context not supported');
    }
  }, [soundEnabled, breathingPhase]);

  // Enhanced breathing exercise with smooth progress tracking
  const handleBreathingExercise = useCallback(() => {
    if (isBreathing && !isPaused) {
      // Pause breathing
      setIsPaused(true);
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      if (breathingTimeoutRef.current) clearTimeout(breathingTimeoutRef.current);
      return;
    }

    if (isPaused) {
      // Resume breathing
      setIsPaused(false);
      continueBreathing();
      return;
    }

    // Start new breathing session
    setIsBreathing(true);
    setIsPaused(false);
    setBreathingPhase('inhale');
    setBreathingCount(0);
    setBreathingProgress(0);
    startBreathingCycle();
  }, [isBreathing, isPaused]);

  const startBreathingCycle = useCallback(() => {
    let currentCycle = 0;
    let currentPhaseProgress = 0;
    let currentPhase = 'inhale';

    const updateProgress = () => {
      const progressInterval = setInterval(() => {
        if (isPaused) return;

        currentPhaseProgress += breathingConfig.progressUpdateInterval;
        
        const getPhaseMaxTime = (phase) => {
          switch (phase) {
            case 'inhale': return breathingConfig.inhaleTime;
            case 'hold': return breathingConfig.holdTime;
            case 'exhale': return breathingConfig.exhaleTime;
            default: return 0;
          }
        };

        const phaseMaxTime = getPhaseMaxTime(currentPhase);
        const phaseProgressPercent = Math.min((currentPhaseProgress / phaseMaxTime) * 100, 100);
        
        // Calculate overall progress
        const cycleProgress = currentCycle / breathingConfig.totalCycles;
        const phaseWeight = 1 / 3; // Each phase is 1/3 of a cycle
        const currentPhaseWeight = currentPhase === 'inhale' ? 0 : 
                                  currentPhase === 'hold' ? phaseWeight : 
                                  phaseWeight * 2;
        
        const totalProgress = ((cycleProgress + (currentPhaseWeight + (phaseProgressPercent / 100) * phaseWeight)) * 100);
        setBreathingProgress(Math.min(totalProgress, 100));

        if (currentPhaseProgress >= phaseMaxTime) {
          currentPhaseProgress = 0;
          
          if (currentPhase === 'inhale') {
            currentPhase = 'hold';
            setBreathingPhase('hold');
          } else if (currentPhase === 'hold') {
            currentPhase = 'exhale';
            setBreathingPhase('exhale');
          } else if (currentPhase === 'exhale') {
            currentCycle++;
            setBreathingCount(currentCycle);
            
            if (currentCycle >= breathingConfig.totalCycles) {
              clearInterval(progressInterval);
              completeBreathingSession();
              return;
            }
            
            currentPhase = 'inhale';
            setBreathingPhase('inhale');
          }
        }
      }, breathingConfig.progressUpdateInterval);

      breathingIntervalRef.current = progressInterval;
    };

    updateProgress();
  }, [isPaused]);

  const continueBreathing = useCallback(() => {
    // Resume from current state
    startBreathingCycle();
  }, [startBreathingCycle]);

  const completeBreathingSession = useCallback(() => {
    setIsBreathing(false);
    setIsPaused(false);
    setBreathingPhase('complete');
    setBreathingProgress(100);
    
    // Show completion message briefly
    setTimeout(() => {
      setBreathingPhase('ready');
      setBreathingProgress(0);
      setBreathingCount(0);
    }, 2000);
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      if (breathingTimeoutRef.current) clearTimeout(breathingTimeoutRef.current);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      }
    };
  }, []);

  // Create ambient sound when phase changes
  useEffect(() => {
    if (isBreathing && !isPaused && soundEnabled) {
      createAmbientSound();
    }
  }, [breathingPhase, isBreathing, isPaused, createAmbientSound, soundEnabled]);

  const handleStartChat = () => {
    navigate('/chat');
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    console.log('Selected mood:', mood);
    setShowMoodModal(false);
  };

  const getBreathingText = () => {
    if (isPaused) return 'Paused - Tap to Resume';
    
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'complete': return 'Well Done! 🌟';
      default: return 'Start Breathing Guide';
    }
  };

  const getBreathingIcon = () => {
    if (!isBreathing) return <Play size={16} />;
    if (isPaused) return <Play size={16} />;
    return <Pause size={16} />;
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

          {/* Enhanced Breathing Exercise */}
          <section className="feature-card breathing-exercise">
            <h3>Guided Breathing</h3>
            <div className="breathing-container">
              {/* Sound Toggle */}
              <div className="breathing-controls">
                <button 
                  className={`sound-toggle ${soundEnabled ? 'enabled' : ''}`}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Disable ambient sounds' : 'Enable ambient sounds'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
              
              {/* Breathing Circle */}
              <div className="breathing-circle-container">
                <button 
                  className={`breathing-circle ${breathingPhase} ${isBreathing ? 'active' : ''}`}
                  onClick={handleBreathingExercise}
                  style={{
                    '--breathing-progress': `${breathingProgress}%`
                  }}
                >
                  <div className="breathing-content">
                    {getBreathingIcon()}
                    <span className="breathing-text">{getBreathingText()}</span>
                    
                    {/* Progress Ring */}
                    {isBreathing && (
                      <svg className="progress-ring" viewBox="0 0 100 100">
                        <circle
                          className="progress-ring-background"
                          cx="50"
                          cy="50"
                          r="45"
                        />
                        <circle
                          className="progress-ring-progress"
                          cx="50"
                          cy="50"
                          r="45"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 45}`,
                            strokeDashoffset: `${2 * Math.PI * 45 * (1 - breathingProgress / 100)}`
                          }}
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Breathing Instructions */}
                  {isBreathing && (
                    <div className="breathing-instructions">
                      <div className="cycle-counter">
                        Cycle {breathingCount + 1} of {breathingConfig.totalCycles}
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* Breathing Session Info */}
              <div className="breathing-info">
                <p className="breathing-description">
                  30-second guided breathing session
                  {soundEnabled && <span className="sound-indicator">🎵</span>}
                </p>
              </div>
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