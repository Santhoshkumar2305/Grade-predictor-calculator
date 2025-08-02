'use client'; 
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { getAuthToken } from '../../lib/auth';
import '../../styles/globals.css';

function HistoryPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = getAuthToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const response = await fetch('/api/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPredictions(data.predictions);
      } else {
        setError(data.message || 'Failed to fetch history.');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('An unexpected error occurred while fetching history.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setIsClient(true);
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this prediction?');
    if (!confirmDelete) return;

    setMessage('');
    setMessageType('');
    const token = getAuthToken();

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Prediction deleted successfully!');
        setMessageType('success');
        fetchHistory();
      } else {
        setMessage(data.message || 'Failed to delete prediction.');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error deleting prediction:', err);
      setMessage('An unexpected error occurred while deleting.');
      setMessageType('error');
    } finally {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  if (!isClient) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Loading History...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container historyContainer">
        <h1>Your Prediction History</h1>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {loading && <p className="loadingMessage">Loading predictions...</p>}
        {error && <p className="errorMessage">Error: {error}</p>}

        {!loading && !error && predictions.length === 0 && (
          <div className="noHistory">
            <p>No predictions found. Go to the <a href="/predict">Predict Grade</a> page to add one!</p>
          </div>
        )}

        {!loading && !error && predictions.length > 0 && (
          <ul className="historyList">
            {predictions.map((prediction) => (
              <li key={prediction._id} className="historyItem">
                <div className="itemHeader">
                  <span className="itemDate">
                    {new Date(prediction.createdAt).toLocaleString()}
                  </span>
                  <span className="itemGrade">
                    Predicted Grade: {prediction.predictedGrade.toFixed(2)}%
                  </span>
                </div>
                <div className="assessmentDetails">
                  <h3>Assessments:</h3>
                  <table className="assessmentTable">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Max Score</th>
                        <th>Weightage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prediction.assessments.map((assessment, idx) => (
                        <tr key={idx}>
                          <td>{assessment.name}</td>
                          <td>{assessment.score}</td>
                          <td>{assessment.maxScore}</td>
                          <td>{assessment.weightage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => handleDelete(prediction._id)} className="deleteButton">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
export default HistoryPage;