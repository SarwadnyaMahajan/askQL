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
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const containerRef = useRef(null);

  useGsap(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/workspace');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="bg-white p-8 rounded-2xl shadow-sm border border-border-color w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-text-secondary mt-2">
            {isLogin 
              ? 'Enter your details to access your workspace.' 
              : 'Sign up to start analyzing your data.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-6">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent-primary hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
