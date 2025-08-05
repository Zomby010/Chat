import React, { useState, useCallback, memo } from 'react';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Facebook, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from './firebase/config';
import { toast } from 'react-toastify';
import { useStore } from '../store/useStore';
import '../styles/login.css';

// Extract InputField component outside to prevent re-creation on every render
const InputField = memo(({ 
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
  onTogglePassword,
  isLoading 
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
        autoComplete={name === 'email' ? 'email' : name === 'password' ? 'current-password' : 'off'}
        disabled={isLoading}
      />
      {showToggle && (
        <button
          type="button"
          className="password-toggle-button"
          onClick={onTogglePassword}
          tabIndex={-1}
          disabled={isLoading}
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

InputField.displayName = 'InputField';

// Extract SocialButton component outside to prevent re-creation on every render
const SocialButton = memo(({ children, onClick, disabled = false, isLoading }) => (
  <button 
    className="social-button" 
    onClick={onClick} 
    disabled={disabled || isLoading}
    type="button"
  >
    {children}
  </button>
));

SocialButton.displayName = 'SocialButton';

const Login = ({ onSwitchToSignup }) => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Initialize providers
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  }, [formData.email, formData.password]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
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

  const handleLoginSuccess = useCallback((user) => {
    // Update global user state
    setUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified
    });
    
    // Show success toast
    toast.success('Login successful');
    
    // Navigate to chat route
    navigate('/welcome');
  }, [setUser, navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      const user = userCredential.user;
      
      handleLoginSuccess(user);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle Firebase auth errors
      let errorMessage = 'Invalid email or password';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = 'Invalid email or password';
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, handleLoginSuccess]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      handleLoginSuccess(user);
      
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [handleLoginSuccess]);

  const handleFacebookLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      handleLoginSuccess(user);
      
    } catch (error) {
      console.error('Facebook login error:', error);
      
      let errorMessage = 'Facebook login failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [handleLoginSuccess]);

  const handleForgotPassword = useCallback(async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address first' });
      toast.error('Please enter your email address first');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, formData.email.trim());
      
      toast.success('Password reset email sent! Check your inbox.');
      setErrors({});
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [formData.email]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
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
              <p className="login-subtitle">Welcome back to your safe space</p>
              <div className="login-description">Continue your mental health journey</div>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <InputField
                icon={Mail}
                label="Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                isLoading={isLoading}
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
                onTogglePassword={togglePasswordVisibility}
                isLoading={isLoading}
              />

              <div className="forgot-password-wrapper">
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>

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
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={20} className="submit-button-arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-toggle-section">
              <p className="auth-toggle-text">
                Don't have an account?
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    className="auth-toggle-button"
                    onClick={onSwitchToSignup}
                    disabled={isLoading}
                  >
                    Sign Up
                  </button>
                </Link>
              </p>
            </div>

            <div className="social-login-section">
              <p className="social-login-divider">Or continue with</p>
              <div className="social-buttons-container">
                <SocialButton onClick={handleGoogleLogin} disabled={isLoading} isLoading={isLoading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="google-icon">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </SocialButton>
                <SocialButton onClick={handleFacebookLogin} disabled={isLoading} isLoading={isLoading}>
                  <Facebook size={20} className="facebook-icon" />
                  Facebook
                </SocialButton>
              </div>
            </div>

            <div className="terms-and-privacy">
              <div className="terms-text">
                <p className="terms-agreement">
                  By signing in, you agree to our{' '}
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

export default Login;