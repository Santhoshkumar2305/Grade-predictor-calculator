'use client';
import React, { useState } from 'react';
import Link from 'next/link';

function AuthForm({ type, onSubmit, message, messageType, isLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  const isLogin = type === 'login';

  return (
    <div className="authCard">
      <div className="authHeader">
        <div className="authIcon">
          {isLogin ? '🔐' : '🚀'}
        </div>
        <h1 className="authTitle">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="authSubtitle">
          {isLogin
            ? 'Sign in to access your grade calculations & academic audits'
            : 'Join GradeTrack to calculate course outcomes and plan target scores'}
        </p>
      </div>

      {message && (
        <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
          <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="formGroup">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            className="formInput"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="formInput"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Must be at least 6 characters long
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btnPrimary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={isLoading}
        >
          {isLoading
            ? 'Processing...'
            : isLogin
            ? 'Sign In to Dashboard'
            : 'Create Free Account'}
        </button>
      </form>

      <div className="authFooterText">
        {isLogin ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ fontWeight: 600 }}>
              Register here
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 600 }}>
              Sign in here
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthForm;