import React, { useState, useCallback } from 'react';
import { Heart, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Facebook, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Firebase imports
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Import your Firebase config

import '../styles/login.css';

// Reusable Input Field Component - moved outside to prevent re-creation
const InputField = React.memo(({ 
  icon: Icon, 
  label, 
  type = 'text', 
  name, 
  placeholder, 
  value, 
  onChange, 
  error, 
  showToggle = false, 
  showPassword: showPass, 
  onTogglePassword 
}) => (
  <div className="form-group">
    <label className="form-label">
      <Icon size={16} className="form-label-icon" />
      {label}
    </label>
    <div className="input-wrapper">
      <input
        className={`form-input ${error ? 'form-input-error' : ''}`}
        type={showToggle ? (showPass ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
      {showToggle && (
        <button
          type="button"
          className="password-toggle-button"
          onClick={onTogglePassword}
        >
          {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
    {error && (
      <div className="error-message">
        <AlertCircle size={14} className="error-icon" />
        {error}
      </div>
    )}
  </div>
));

// Social Button Component - moved outside to prevent re-creation
const SocialButton = React.memo(({ children, onClick, disabled }) => (
  <button className="social-button" onClick={onClick} disabled={disabled}>
    {children}
  </button>
));

const Signup = ({ onSwitchToLogin }) => {
  // State hooks for form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // UI state hooks
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form validation function
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters long';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  }, [formData]);

  // Optimized input change handler using useCallback
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Password toggle handlers with useCallback
  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Main signup handler with Firebase Authentication and Firestore
  // Improved signup handler with better Firestore error handling
const handleSignUp = async (e) => {
  e.preventDefault();
  
  // Validate form
  const newErrors = validateForm();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  setIsLoading(true);
  setErrors({});
  
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: formData.fullName
    });
    
    // Prepare user data for Firestore
    const userData = {
      fullName: formData.fullName.trim(),
      email: formData.email,
      createdAt: new Date().toISOString(),
      uid: user.uid
    };
    
    // Save user data to Firestore with better error handling
    try {
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('User data saved to Firestore successfully');
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      
      // Even if Firestore fails, the user is created in Auth
      // You might want to handle this case differently
      toast.warning('Account created but profile data could not be saved. Please try updating your profile later.');
    }
    
    // Show success message
    toast.success('Account created successfully! Welcome to MindMate!', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    
    console.log('User registered successfully:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Firebase Authentication errors
    let errorMessage = 'Something went wrong. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        setErrors({ email: errorMessage });
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        setErrors({ email: errorMessage });
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        setErrors({ password: errorMessage });
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        setErrors({ submit: errorMessage });
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection and try again.';
        setErrors({ submit: errorMessage });
        break;
      // Add Firestore specific errors
      case 'permission-denied':
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
        setErrors({ submit: errorMessage });
        break;
      case 'not-found':
        errorMessage = 'Firestore database not found. Please check your Firebase configuration.';
        setErrors({ submit: errorMessage });
        break;
      default:
        setErrors({ submit: errorMessage });
    }
    
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // Social authentication handlers with useCallback
  const handleGoogleSignup = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Google authentication
      // const provider = new GoogleAuthProvider();
      // const result = await signInWithPopup(auth, provider);
      toast.info('Google signup coming soon!');
      console.log('Google signup initiated');
    } catch (error) {
      toast.error('Google signup failed. Please try again.');
      setErrors({ submit: 'Google signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFacebookSignup = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Facebook authentication
      // const provider = new FacebookAuthProvider();
      // const result = await signInWithPopup(auth, provider);
      toast.info('Facebook signup coming soon!');
      console.log('Facebook signup initiated');
    } catch (error) {
      toast.error('Facebook signup failed. Please try again.');
      setErrors({ submit: 'Facebook signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-card">
            <div className="login-header">
              <div className="login-brand">
                <Heart size={32} className="brand-icon" />
                <h1 className="brand-title">MindMate</h1>
              </div>
              <p className="login-subtitle">Join our supportive community</p>
              <div className="login-description">Start your path to wellness</div>
            </div>

            <form className="login-form" onSubmit={handleSignUp}>
              <InputField
                icon={User}
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                error={errors.fullName}
              />

              <InputField
                icon={Mail}
                label="Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
              />

              <InputField
                icon={Lock}
                label="Password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                showToggle={true}
                showPassword={showPassword}
                onTogglePassword={togglePassword}
              />

              <InputField
                icon={Lock}
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                showToggle={true}
                showPassword={showConfirmPassword}
                onTogglePassword={toggleConfirmPassword}
              />

              {errors.submit && (
                <div className="submit-error-message">
                  <AlertCircle size={16} className="submit-error-icon" />
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'submit-button-loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} className="submit-button-arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-toggle-section">
              <p className="auth-toggle-text">
                Already have an account?
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    className="auth-toggle-button"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                  >
                    Login
                  </button>
                </Link>
              </p>
            </div>

            <div className="social-login-section">
              <p className="social-login-divider">Or continue with</p>
              <div className="social-buttons-container">
                <SocialButton onClick={handleGoogleSignup} disabled={isLoading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="google-icon">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </SocialButton>
                <SocialButton onClick={handleFacebookSignup} disabled={isLoading}>
                  <Facebook size={20} className="facebook-icon" />
                  Facebook
                </SocialButton>
              </div>
            </div>

            <div className="terms-and-privacy">
              <div className="terms-text">
                <p className="terms-agreement">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="terms-link">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="privacy-link">Privacy Policy</a>
                </p>
                <p className="security-notice">
                  <Shield size={14} className="security-icon" />
                  Your privacy and security are our top priority
                </p>
              </div>
            </div>

            <div className="crisis-help-section">
              <div className="crisis-help-content">
                <p className="crisis-help-title">In Crisis? Get Help Now</p>
                <div className="crisis-links">
                  <a href="tel:988" className="crisis-link">988 - Crisis Lifeline</a>
                  <a href="tel:911" className="crisis-link emergency-link">911 - Emergency</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;