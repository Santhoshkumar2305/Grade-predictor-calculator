'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '../../components/AuthForm';
import { setAuthToken } from '../../lib/auth';
import '../../styles/globals.css';

function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        setMessage(data.message || 'Login successful! Redirecting to dashboard...');
        setMessageType('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An unexpected error occurred. Please try again later.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="authContainer">
      <AuthForm
        type="login"
        onSubmit={handleLogin}
        message={message}
        messageType={messageType}
        isLoading={isLoading}
      />
    </div>
  );
}
export default LoginPage;