'use client';
import React, { useState } from 'react';
import '../styles/globals.css';

function AuthForm({ type, onSubmit, message, messageType, isLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="authCard">
      <h1>{type === 'login' ? 'Login' : 'Register'}</h1>
      {message && (
        <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />
        </div>
        <button type="submit" className="submitButton" disabled={isLoading}>
          {isLoading ? 'Loading...' : (type === 'login' ? 'Login' : 'Register')}
        </button>
      </form>

      <p className="linkText">
        {type === 'login' ? (
          <>
            Don't have an account? <a href="/register">Register here</a>
          </>
        ) : (
          <>
            Already have an account? <a href="/login">Login here</a>
          </>
        )}
      </p>
    </div>
  );
}
export default AuthForm;