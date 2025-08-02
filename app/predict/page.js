'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import PredictionForm from '../../components/PredictionForm';
import { getAuthToken } from '../../lib/auth';
import '../../styles/globals.css';

function PredictPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  const handlePredictResult = (grade, msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSavePrediction = async (assessments, predictedGrade, msg, type) => {
    if (msg) {
      setMessage(msg);
      setMessageType(type);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    const token = getAuthToken();
    if (!token) {
      setMessage('You are not logged in. Please log in to save predictions.');
      setMessageType('error');
      setIsLoading(false);
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assessments, predictedGrade }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Prediction saved successfully!');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to save prediction.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
      setMessage('An unexpected error occurred while saving.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  if (!isClient) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Loading Prediction Page...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container predictContainer">
        <PredictionForm
          onPredict={handlePredictResult}
          onSave={handleSavePrediction}
          message={message}
          messageType={messageType}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
export default PredictPage;
