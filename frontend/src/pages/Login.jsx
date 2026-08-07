import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import useGsap from '../hooks/useGsap';
import gsap from 'gsap';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Validation and UI states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const cardRef = useRef(null);
  const formRef = useRef(null);

  // GSAP Entrance Animations
  useGsap(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        cardRef.current,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7 }
      );

      if (formRef.current) {
        const elements = formRef.current.querySelectorAll('.form-group, .auth-alert, .form-options, .btn-submit, .demo-section');
        tl.fromTo(
          elements,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 },
          '-=0.3'
        );
      }
    }, cardRef.current);

    return () => ctx.revert();
  }, [isLogin]);

  // Client-side Validation Logic
  const validateForm = () => {
    const newErrors = {};
    
    // Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password check
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!isLogin && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password strength score (0 to 3)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#E5E7EB' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: '#EF4444', pct: '33%' };
    
    let score = 1;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      score = 3; // Strong
    } else if (pwd.length >= 6) {
      score = 2; // Fair
    }

    if (score === 3) return { score: 3, label: 'Strong', color: '#10B981', pct: '100%' };
    return { score: 2, label: 'Fair', color: '#F59E0B', pct: '66%' };
  };

  const strength = getPasswordStrength(password);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/workspace');
    } catch (err) {
      // If registration fails because user exists, try auto-login or display clear message
      setServerError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Login Handler
  const handleDemoLogin = async () => {
    setServerError('');
    setIsSubmitting(true);
    const demoEmail = 'analyst@company.com';
    const demoPass = 'password123';
    
    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      // Try login first
      await login(demoEmail, demoPass);
      navigate('/workspace');
    } catch {
      try {
        // If demo user doesn't exist yet, auto register then login
        await register(demoEmail, demoPass);
        navigate('/workspace');
      } catch (err) {
        setServerError(err.message || 'Failed to authenticate demo user.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg-grid" />

      <div ref={cardRef} className="auth-card">
        {/* Brand Header */}
        <div className="auth-card__brand">
          <div className="auth-card__logo-icon">📊</div>
          <span className="auth-card__brand-title">AI Data Analyst</span>
        </div>

        {/* Title & Subtitle */}
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="auth-card__subtitle">
            {isLogin
              ? 'Sign in to access your data analysis workspace.'
              : 'Start analyzing datasets with AI in seconds.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tabs">
          <div className={`auth-tab__indicator ${!isLogin ? 'auth-tab__indicator--signup' : ''}`} />
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setErrors({});
              setServerError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setErrors({});
              setServerError('');
            }}
          >
            Register
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="auth-alert mb-4">
            <span>⚠️</span>
            <div style={{ flex: 1 }}>{serverError}</div>
          </div>
        )}

        {/* Form Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              <span>Email Address</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="email-input"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              <span>Password</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="form-input-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}

            {/* Password strength indicator for signup */}
            {!isLogin && password.length > 0 && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  <div
                    className="password-strength__fill"
                    style={{ width: strength.pct, backgroundColor: strength.color }}
                  />
                </div>
                <span className="password-strength__label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Options Row (Remember Me & Forgot Password) */}
          {isLogin && (
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a 
                href="#forgot" 
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For password resets, please contact your administrator.');
                }}
              >
                Forgot password?
              </a>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="btn-submit"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isSubmitting ? (
              <>
                <span className="btn__spinner" />
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In to Workspace' : 'Create Account'}</span>
            )}
          </Button>
        </form>

        {/* Demo Login Divider & Button */}
        <div className="demo-section">
          <div className="demo-divider">Or quick test</div>
          <button
            type="button"
            className="btn-demo"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
          >
            <span>⚡</span>
            <span>One-Click Demo Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
