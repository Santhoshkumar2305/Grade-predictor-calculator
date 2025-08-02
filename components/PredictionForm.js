'use client'; 
import React, { useState, useEffect } from 'react';
import '../styles/globals.css';

function PredictionForm({ onPredict, onSave, isLoading }) {
  const [assessments, setAssessments] = useState([{ name: '', score: '', maxScore: '', weightage: '' }]);
  const [predictedGrade, setPredictedGrade] = useState(null);
  const [totalWeightage, setTotalWeightage] = useState(0);

  const handleAssessmentChange = (index, field, value) => {
    const newAssessments = [...assessments];
    newAssessments[index][field] = value;
    setAssessments(newAssessments);
  };

  const addAssessment = () => {
    setAssessments([...assessments, { name: '', score: '', maxScore: '', weightage: '' }]);
  };

  const removeAssessment = (index) => {
    const newAssessments = assessments.filter((_, i) => i !== index);
    setAssessments(newAssessments);
  };

  const calculateGrade = () => {
    let sumWeightedScores = 0;
    let currentTotalWeightage = 0;
    let hasError = false;

    for (const item of assessments) {
      const score = parseFloat(item.score);
      const maxScore = parseFloat(item.maxScore);
      const weightage = parseFloat(item.weightage);

      if (isNaN(score) || isNaN(maxScore) || isNaN(weightage) ||
          score < 0 || maxScore <= 0 || weightage < 0 || weightage > 100) {
        hasError = true;
        break;
      }
      const weightedScore = (score / maxScore) * weightage;
      sumWeightedScores += weightedScore;
      currentTotalWeightage += weightage;
    }

    if (hasError) {
      onPredict(null, 'Please ensure all fields are valid numbers and max score is greater than 0. Weightage must be between 0 and 100.', 'error');
      setPredictedGrade(null);
      setTotalWeightage(0);
      return;
    }

    if (currentTotalWeightage === 0) {
      onPredict(null, 'Please enter at least one assessment with a weightage greater than 0.', 'error');
      setPredictedGrade(null);
      setTotalWeightage(0);
      return;
    }
    const finalGrade = (sumWeightedScores / currentTotalWeightage) * 100;
    setPredictedGrade(finalGrade.toFixed(2));
    setTotalWeightage(currentTotalWeightage);
    onPredict(finalGrade.toFixed(2), 'Grade predicted successfully!', 'success');
  };

  const handleSavePrediction = (e) => {
    e.preventDefault();
    if (predictedGrade !== null && !isNaN(predictedGrade) && assessments.length > 0) {
      onSave(assessments, parseFloat(predictedGrade));
    } else {
      onSave(null, null, 'Please calculate a valid grade before saving.', 'error');
    }
  };

  useEffect(() => {
    calculateGrade();
  }, [assessments]);

  return (
    <div className="predictContainer">
      <h1>Predict Your Final Grade</h1>
      <p>Enter details for your assessments to get an instant grade prediction.</p>

      <div className="formSection">
        {assessments.map((item, index) => (
          <div key={index} className="assessmentItem">
            <div className="formGroup">
              <label htmlFor={`name-${index}`}>Assessment Name</label>
              <input
                type="text"
                id={`name-${index}`}
                value={item.name}
                onChange={(e) => handleAssessmentChange(index, 'name', e.target.value)}
                placeholder="e.g., Quiz 1, Midterm"
                aria-label={`Assessment Name ${index + 1}`}
              />
            </div>
            <div className="formGroup">
              <label htmlFor={`score-${index}`}>Score</label>
              <input
                type="number"
                id={`score-${index}`}
                value={item.score}
                onChange={(e) => handleAssessmentChange(index, 'score', e.target.value)}
                min="0"
                required
                aria-label={`Score for ${item.name}`}
              />
            </div>
            <div className="formGroup">
              <label htmlFor={`maxScore-${index}`}>Max Score</label>
              <input
                type="number"
                id={`maxScore-${index}`}
                value={item.maxScore}
                onChange={(e) => handleAssessmentChange(index, 'maxScore', e.target.value)}
                min="1"
                required
                aria-label={`Max Score for ${item.name}`}
              />
            </div>
            <div className="formGroup">
              <label htmlFor={`weightage-${index}`}>Weightage (%)</label>
              <input
                type="number"
                id={`weightage-${index}`}
                value={item.weightage}
                onChange={(e) => handleAssessmentChange(index, 'weightage', e.target.value)}
                min="0"
                max="100"
                required
                aria-label={`Weightage for ${item.name}`}
              />
            </div>
            {assessments.length > 1 && (
              <button type="button" onClick={() => removeAssessment(index)} className="removeButton">
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addAssessment} className="addAssessmentButton">
          Add Another Assessment
        </button>
      </div>

      {predictedGrade !== null && !isNaN(predictedGrade) && (
        <div className="predictionResult">
          Predicted Grade: <span>{predictedGrade}%</span>
          {totalWeightage && (
            <p style={{ fontSize: '0.9rem', marginTop: '10px', fontWeight: 'normal' }}>
              (Based on {totalWeightage}% of total weightage)
            </p>
          )}
        </div>
      )}

      <button type="submit" onClick={handleSavePrediction} className="submitButton" disabled={isLoading || predictedGrade === null || isNaN(predictedGrade)}>
        {isLoading ? 'Saving...' : 'Save Prediction'}
      </button>
    </div>
  );
}
export default PredictionForm;