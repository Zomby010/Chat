import React, { useState } from 'react';
import { Heart, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Facebook, Github, Shield } from 'lucide-react';
import'../styles/login.css';


const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Full name is required';
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
    }
    
    if (!isLogin && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleInputChange = (e) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isLogin) {
        console.log('Login successful:', { email: formData.email });
      } else {
        console.log('Registration successful:', formData);
      }
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const InputField = ({ 
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
  );

  const SocialButton = ({ children, onClick }) => (
    <button className="social-button" onClick={onClick}>
      {children}
    </button>
  );

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
              <p className="login-subtitle">
                {isLogin ? 'Welcome back to your safe space' : 'Join our supportive community'}
              </p>
              <div className="login-description">
                {isLogin ? 'Continue your mental health journey' : 'Start your path to wellness'}
              </div>
            </div>

            <div className="login-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <InputField
                  icon={User}
                  label="Full Name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                />
              )}

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
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {!isLogin && (
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
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}

              {isLogin && (
                <div className="forgot-password-wrapper">
                  <button type="button" className="forgot-password-link">
                    Forgot Password?
                  </button>
                </div>
              )}

              {errors.submit && (
                <div className="submit-error-message">
                  <AlertCircle size={16} className="submit-error-icon" />
                  {errors.submit}
                </div>
              )}

              <div
                className={`submit-button ${isLoading ? 'submit-button-loading' : ''}`}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="submit-button-arrow" />
                  </>
                )}
              </div>
            </div>

            <div className="auth-toggle-section">
              <p className="auth-toggle-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  className="auth-toggle-button"
                  onClick={toggleMode}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            <div className="social-login-section">
              <p className="social-login-divider">Or continue with</p>
              <div className="social-buttons-container">
                <SocialButton onClick={() => console.log('Google login')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="google-icon">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </SocialButton>
                <SocialButton onClick={() => console.log('Facebook login')}>
                  <Facebook size={20} className="facebook-icon" />
                  Facebook
                </SocialButton>
              </div>
            </div>

            <div className="terms-and-privacy">
              <div className="terms-text">
                <p className="terms-agreement">
                  By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
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

export default LoginPage;