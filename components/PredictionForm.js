'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getGradeDetails, calculateRequiredFinalScore } from '../utils/gradeUtils';

function PredictionForm({ onPredict, onSave, message, messageType, isLoading }) {
  // Mode selection: 'weighted' or 'target_planner'
  const [activeTab, setActiveTab] = useState('weighted');

  // Course metadata (all start completely empty)
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('');

  // Assessments list starts completely empty
  const [assessments, setAssessments] = useState([]);

  // Target Planner inputs start completely empty
  const [targetGrade, setTargetGrade] = useState('');
  const [remainingWeight, setRemainingWeight] = useState('');

  // Calculated state
  const [predictedGrade, setPredictedGrade] = useState(null);
  const [totalWeightage, setTotalWeightage] = useState(0);
  const [gradeDetails, setGradeDetails] = useState(null);
  const [targetResult, setTargetResult] = useState(null);

  const handleAssessmentChange = (index, field, value) => {
    setAssessments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addAssessment = () => {
    setAssessments((prev) => [
      ...prev,
      { name: '', score: '', maxScore: '', weightage: '' },
    ]);
  };

  const removeAssessment = (index) => {
    setAssessments((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate current weighted standing
  const calculateGrade = useCallback((showErrors = false) => {
    if (assessments.length === 0) {
      if (showErrors && onPredict) {
        onPredict(null, 'Please add at least one assessment row.', 'error');
      }
      setPredictedGrade(null);
      setGradeDetails(null);
      setTotalWeightage(0);
      return null;
    }

    let sumWeightedScores = 0;
    let currentTotalWeightage = 0;
    let hasValidationError = false;
    let validationMessage = '';
    let completedCount = 0;

    for (let i = 0; i < assessments.length; i++) {
      const item = assessments[i];
      const name = item.name ? item.name.trim() : '';
      const scoreStr = item.score !== undefined && item.score !== null ? String(item.score).trim() : '';
      const maxScoreStr = item.maxScore !== undefined && item.maxScore !== null ? String(item.maxScore).trim() : '';
      const weightageStr = item.weightage !== undefined && item.weightage !== null ? String(item.weightage).trim() : '';

      if (!name && !scoreStr && !maxScoreStr && !weightageStr) {
        if (showErrors && assessments.length === 1) {
          hasValidationError = true;
          validationMessage = 'Please enter assessment details.';
          break;
        }
        continue;
      }

      if (!scoreStr || !maxScoreStr || !weightageStr) {
        if (showErrors) {
          hasValidationError = true;
          validationMessage = `Please complete all score and weightage fields for "${name || `Assessment ${i + 1}`}."`;
          break;
        }
        continue;
      }

      const score = parseFloat(scoreStr);
      const maxScore = parseFloat(maxScoreStr);
      const weightage = parseFloat(weightageStr);

      if (isNaN(score) || score < 0) {
        hasValidationError = true;
        validationMessage = `Assessment "${name || i + 1}" has an invalid score. Score cannot be negative.`;
        break;
      }
      if (isNaN(maxScore) || maxScore <= 0) {
        hasValidationError = true;
        validationMessage = `Assessment "${name || i + 1}" max score must be greater than 0.`;
        break;
      }
      if (score > maxScore) {
        hasValidationError = true;
        validationMessage = `Assessment "${name || i + 1}" score (${score}) cannot exceed max score (${maxScore}).`;
        break;
      }
      if (isNaN(weightage) || weightage < 0 || weightage > 100) {
        hasValidationError = true;
        validationMessage = `Assessment "${name || i + 1}" weightage must be between 0 and 100%.`;
        break;
      }

      const weightedScore = (score / maxScore) * weightage;
      sumWeightedScores += weightedScore;
      currentTotalWeightage += weightage;
      completedCount++;
    }

    if (currentTotalWeightage > 100.01) {
      hasValidationError = true;
      validationMessage = `Total weightage across assessments (${currentTotalWeightage.toFixed(1)}%) cannot exceed 100%.`;
    }

    if (hasValidationError) {
      if (showErrors && onPredict) {
        onPredict(null, validationMessage, 'error');
      }
      setPredictedGrade(null);
      setGradeDetails(null);
      setTotalWeightage(currentTotalWeightage);
      return null;
    }

    if (completedCount === 0 || currentTotalWeightage === 0) {
      if (showErrors && onPredict) {
        onPredict(null, 'Please enter at least one valid assessment with score and weightage.', 'error');
      }
      setPredictedGrade(null);
      setGradeDetails(null);
      setTotalWeightage(0);
      return null;
    }

    const finalGrade = (sumWeightedScores / currentTotalWeightage) * 100;
    const gradeFormatted = Number(finalGrade.toFixed(2));
    const details = getGradeDetails(gradeFormatted);

    setPredictedGrade(gradeFormatted);
    setGradeDetails(details);
    setTotalWeightage(Number(currentTotalWeightage.toFixed(1)));

    if (showErrors && onPredict) {
      onPredict(gradeFormatted, 'Grade calculated successfully!', 'success');
    }

    return { finalGrade: gradeFormatted, totalWeightage: currentTotalWeightage, details };
  }, [assessments, onPredict]);

  // Recalculate target planner
  useEffect(() => {
    if (activeTab === 'target_planner') {
      if (targetGrade && remainingWeight) {
        const result = calculateRequiredFinalScore({
          assessments,
          targetGrade,
          remainingWeight,
        });
        setTargetResult(result);
      } else {
        setTargetResult(null);
      }
    }
  }, [activeTab, assessments, targetGrade, remainingWeight]);

  useEffect(() => {
    calculateGrade(false);
  }, [calculateGrade]);

  const handleSave = (e) => {
    e.preventDefault();

    if (assessments.length === 0) {
      if (onSave) {
        onSave(null, null, 'Please add at least one assessment row before saving.', 'error');
      }
      return;
    }

    // Verify all rows have names
    for (let i = 0; i < assessments.length; i++) {
      const item = assessments[i];
      if (!item.name || !item.name.trim()) {
        if (onSave) {
          onSave(null, null, `Please provide a name for assessment ${i + 1}.`, 'error');
        }
        return;
      }
    }

    const result = calculateGrade(true);
    if (!result || isNaN(result.finalGrade)) return;

    const sanitizedAssessments = assessments.map((item) => ({
      name: item.name.trim(),
      score: parseFloat(item.score),
      maxScore: parseFloat(item.maxScore),
      weightage: parseFloat(item.weightage),
    }));

    if (onSave) {
      onSave({
        courseName: courseName.trim() || 'General Coursework',
        semester: semester.trim() || 'Current Semester',
        mode: activeTab,
        assessments: sanitizedAssessments,
        predictedGrade: result.finalGrade,
        targetGrade: activeTab === 'target_planner' && targetResult?.targetGrade ? targetResult.targetGrade : null,
        requiredFinalScore: activeTab === 'target_planner' && targetResult?.requiredFinalScore ? targetResult.requiredFinalScore : null,
      });
    }
  };

  // Progress bar color based on percentage
  const progressPercent = Math.min(100, Math.max(0, totalWeightage));
  let progressColor = '#6366f1';
  if (progressPercent > 100) progressColor = '#ef4444';
  else if (progressPercent === 100) progressColor = '#10b981';

  return (
    <div className="predictorCard">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Academic Grade Calculator & Target Planner
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Model your course syllabus, calculate current standing, and solve final exam target requirements with 10.0 CGPA.
        </p>
      </div>

      {message && (
        <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
          <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabNavigation">
        <button
          type="button"
          onClick={() => setActiveTab('weighted')}
          className={`tabBtn ${activeTab === 'weighted' ? 'tabBtnActive' : ''}`}
        >
          <span>⚖️</span> Weighted Grade Calculator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('target_planner')}
          className={`tabBtn ${activeTab === 'target_planner' ? 'tabBtnActive' : ''}`}
        >
          <span>🎯</span> Final Exam Target Solver
        </button>
      </div>

      {/* Course Metadata Fields */}
      <div className="courseMetaGrid">
        <div className="formGroup">
          <label htmlFor="courseName">Course Code / Subject Name</label>
          <input
            type="text"
            id="courseName"
            className="formInput"
            placeholder="Enter course name (e.g. CS301 - Data Structures)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
        </div>
        <div className="formGroup">
          <label htmlFor="semester">Academic Term / Semester</label>
          <input
            type="text"
            id="semester"
            className="formInput"
            placeholder="Enter semester (e.g. 5th Semester - Fall 2026)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>
      </div>

      {/* Target Planner Specific Controls */}
      {activeTab === 'target_planner' && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="formGroup">
              <label htmlFor="targetGrade">Desired Final Grade Goal (%)</label>
              <input
                type="number"
                id="targetGrade"
                className="formInput"
                placeholder="Enter target (e.g. 85 for an A)"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                min="1"
                max="100"
              />
            </div>
            <div className="formGroup">
              <label htmlFor="remainingWeight">Remaining Final Exam Weight (%)</label>
              <input
                type="number"
                id="remainingWeight"
                className="formInput"
                placeholder="Enter final exam weight (e.g. 40)"
                value={remainingWeight}
                onChange={(e) => setRemainingWeight(e.target.value)}
                min="1"
                max="100"
              />
            </div>
          </div>

          {targetResult && !targetResult.error && (
            <div
              className="targetPlannerAlert"
              style={{
                backgroundColor: `${targetResult.color}15`,
                borderColor: `${targetResult.color}40`,
                color: '#fff',
              }}
            >
              <div className="targetIconLarge">
                {targetResult.feasibility === 'impossible' ? '🚫' : targetResult.feasibility === 'secured' ? '🏆' : '🎯'}
              </div>
              <div className="targetAlertContent">
                <h3 style={{ color: targetResult.color }}>
                  {targetResult.feasibility === 'impossible'
                    ? 'Target Mathematically Unachievable'
                    : targetResult.feasibility === 'secured'
                    ? 'Target Already Secured!'
                    : `Score Required on Final: ${targetResult.requiredFinalScore}%`}
                </h3>
                <p>{targetResult.message}</p>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Earned Weighted Points: <strong>{targetResult.currentWeightedScore}%</strong> | Completed Weight: <strong>{targetResult.currentCompletedWeight}%</strong> | Max Possible: <strong>{targetResult.maxPossibleGrade}%</strong>
                </div>
              </div>
            </div>
          )}

          {targetResult?.error && (
            <div className="message error">
              <span>⚠️</span>
              <span>{targetResult.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Weightage Allocation Progress Bar */}
      <div className="weightageProgressWrapper">
        <div className="progressLabelRow">
          <span>Course Weightage Allocation</span>
          <span style={{ color: progressColor }}>
            {totalWeightage}% / 100% {totalWeightage === 100 ? '✅ Complete' : totalWeightage > 100 ? '⚠️ Exceeds 100%' : `(${100 - totalWeightage}% Remaining)`}
          </span>
        </div>
        <div className="progressBarTrack">
          <div
            className="progressBarFill"
            style={{ width: `${Math.min(100, totalWeightage)}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>

      {/* Assessment Dynamic Rows */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evaluations & Assessments</h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} added
          </span>
        </div>

        {assessments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '14px' }}>
              No evaluation rows added yet. Click &quot;+ Add Evaluation Row&quot; below to add your assignments, quizzes, labs, or midterms.
            </p>
          </div>
        ) : (
          assessments.map((item, index) => (
            <div key={index} className="assessmentItemCard">
              <div className="formGroup">
                <label htmlFor={`name-${index}`}>Assessment Name</label>
                <input
                  type="text"
                  id={`name-${index}`}
                  className="formInput"
                  value={item.name}
                  onChange={(e) => handleAssessmentChange(index, 'name', e.target.value)}
                  placeholder="e.g. Midterm, Lab 1, Assignment"
                  required
                />
              </div>
              <div className="formGroup">
                <label htmlFor={`score-${index}`}>Score Earned</label>
                <input
                  type="number"
                  id={`score-${index}`}
                  className="formInput"
                  value={item.score}
                  onChange={(e) => handleAssessmentChange(index, 'score', e.target.value)}
                  min="0"
                  step="any"
                  placeholder="e.g. 85"
                  required
                />
              </div>
              <div className="formGroup">
                <label htmlFor={`maxScore-${index}`}>Max Score</label>
                <input
                  type="number"
                  id={`maxScore-${index}`}
                  className="formInput"
                  value={item.maxScore}
                  onChange={(e) => handleAssessmentChange(index, 'maxScore', e.target.value)}
                  min="1"
                  step="any"
                  placeholder="e.g. 100"
                  required
                />
              </div>
              <div className="formGroup">
                <label htmlFor={`weightage-${index}`}>Weight (%)</label>
                <input
                  type="number"
                  id={`weightage-${index}`}
                  className="formInput"
                  value={item.weightage}
                  onChange={(e) => handleAssessmentChange(index, 'weightage', e.target.value)}
                  min="0"
                  max="100"
                  step="any"
                  placeholder="e.g. 25"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeAssessment(index)}
                className="removeRowBtn"
                title="Remove Assessment"
                aria-label="Remove Assessment"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <button type="button" onClick={addAssessment} className="addRowBtn">
          <span>➕</span> Add Evaluation Row
        </button>
      </div>

      {/* Real-time Calculation Summary Box */}
      {predictedGrade !== null && gradeDetails && (
        <div className="predictionSummaryBox">
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Academic Performance Calculation</h3>
            <span
              style={{
                background: `${gradeDetails.color}25`,
                color: gradeDetails.color,
                border: `1px solid ${gradeDetails.color}50`,
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {gradeDetails.status}
            </span>
          </div>

          <div className="resultsMetricRow">
            <div className="resultMetricItem">
              <div className="resultMetricLabel">Weighted Score</div>
              <div className="resultMetricValue" style={{ color: gradeDetails.color }}>
                {predictedGrade}%
              </div>
            </div>
            <div className="resultMetricItem">
              <div className="resultMetricLabel">Letter Grade</div>
              <div className="resultMetricValue" style={{ color: gradeDetails.color }}>
                {gradeDetails.letter}
              </div>
            </div>
            <div className="resultMetricItem">
              <div className="resultMetricLabel">CGPA (10.0 Scale)</div>
              <div className="resultMetricValue" style={{ color: '#38bdf8' }}>
                {gradeDetails.cgpa10}
              </div>
            </div>
            <div className="resultMetricItem">
              <div className="resultMetricLabel">Academic Classification</div>
              <div className="resultMetricValue" style={{ fontSize: '1.1rem', paddingTop: '8px' }}>
                {gradeDetails.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Action */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={handleSave}
          className="btnPrimary"
          style={{ flex: 1, padding: '14px' }}
          disabled={isLoading || predictedGrade === null || assessments.length === 0}
        >
          {isLoading ? 'Saving Calculation to Database...' : '💾 Save Calculation to History'}
        </button>
      </div>
    </div>
  );
}

export default PredictionForm;