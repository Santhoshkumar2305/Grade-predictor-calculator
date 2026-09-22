'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import PredictionForm from '../../components/PredictionForm';
import { getAuthToken, removeAuthToken } from '../../lib/auth';

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

  const handleSavePrediction = async (payloadOrAssessments, predictedGradeArg, msg, type) => {
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
      setMessage('You are not logged in. Please log in to save simulations.');
      setMessageType('error');
      setIsLoading(false);
      router.push('/login');
      return;
    }

    // Support both new structured object and legacy arguments
    let bodyPayload;
    if (payloadOrAssessments && typeof payloadOrAssessments === 'object' && !Array.isArray(payloadOrAssessments)) {
      bodyPayload = payloadOrAssessments;
    } else {
      bodyPayload = {
        assessments: payloadOrAssessments,
        predictedGrade: predictedGradeArg,
      };
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Calculation saved successfully to your audit history!');
        setMessageType('success');
      } else if (response.status === 401) {
        removeAuthToken();
        setMessage('Your session has expired. Redirecting to login...');
        setMessageType('error');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        setMessage(data.message || 'Failed to save calculation.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      setMessage('An unexpected network error occurred while saving.');
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
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading Academic Calculator...</h2>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <PredictionForm
          onPredict={handlePredictResult}
          onSave={handleSavePrediction}
          message={message}
          messageType={messageType}
          isLoading={isLoading}
        />
      </main>
    </>
  );
}

export default PredictPage;
