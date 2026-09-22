'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { getAuthToken, removeAuthToken } from '../../lib/auth';
import { getGradeDetails, calculateRequiredFinalScore } from '../../utils/gradeUtils';

function HistoryPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Print single audit state
  const [printSingleItem, setPrintSingleItem] = useState(null);

  // Edit audit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    courseName: '',
    semester: '',
    mode: 'weighted',
    targetGrade: '',
    remainingWeight: '',
    assessments: [],
  });
  const [isUpdating, setIsUpdating] = useState(false);

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
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPredictions(data.predictions || []);
      } else if (response.status === 401) {
        removeAuthToken();
        router.replace('/login');
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

  // Handle printing all audits
  const handlePrintAll = () => {
    setPrintSingleItem(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handle printing a specific individual audit
  const handlePrintSingle = (item) => {
    setPrintSingleItem(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Delete an audit
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this calculation from your history?');
    if (!confirmDelete) return;

    setMessage('');
    setMessageType('');
    const token = getAuthToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Calculation deleted successfully!');
        setMessageType('success');
        fetchHistory();
      } else if (response.status === 401) {
        removeAuthToken();
        router.replace('/login');
      } else {
        setMessage(data.message || 'Failed to delete calculation.');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error deleting calculation:', err);
      setMessage('An unexpected error occurred while deleting.');
      setMessageType('error');
    } finally {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      courseName: item.courseName || '',
      semester: item.semester || '',
      mode: item.mode || 'weighted',
      targetGrade: item.targetGrade !== null ? String(item.targetGrade) : '',
      remainingWeight: item.mode === 'target_planner' && item.assessments ? String(Math.max(0, 100 - item.assessments.reduce((sum, a) => sum + (Number(a.weightage) || 0), 0))) : '',
      assessments: item.assessments
        ? item.assessments.map((a) => ({
            name: a.name || '',
            score: String(a.score ?? ''),
            maxScore: String(a.maxScore ?? ''),
            weightage: String(a.weightage ?? ''),
          }))
        : [],
    });
  };

  // Edit Modal Assessment handlers
  const handleEditAssessmentChange = (index, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const addEditAssessment = () => {
    setEditForm((prev) => ({
      ...prev,
      assessments: [...prev.assessments, { name: '', score: '', maxScore: '', weightage: '' }],
    }));
  };

  const removeEditAssessment = (index) => {
    setEditForm((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((_, i) => i !== index),
    }));
  };

  // Recalculate grade live inside edit modal
  const computeEditGrade = () => {
    let sum = 0;
    let totalWeight = 0;
    for (const a of editForm.assessments) {
      const score = parseFloat(a.score);
      const maxScore = parseFloat(a.maxScore);
      const weight = parseFloat(a.weightage);
      if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0 && !isNaN(weight) && weight > 0) {
        sum += (score / maxScore) * weight;
        totalWeight += weight;
      }
    }
    const finalScore = totalWeight > 0 ? (sum / totalWeight) * 100 : 0;
    const finalFormatted = Number(finalScore.toFixed(2));
    const details = getGradeDetails(finalFormatted);
    return { finalGrade: finalFormatted, totalWeight, details };
  };

  // Save updated audit
  const handleUpdateAudit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editForm.assessments.length === 0) {
      alert('Please have at least one assessment row.');
      return;
    }

    for (let i = 0; i < editForm.assessments.length; i++) {
      const a = editForm.assessments[i];
      if (!a.name || !a.name.trim()) {
        alert(`Please enter a name for assessment ${i + 1}.`);
        return;
      }
    }

    const { finalGrade } = computeEditGrade();
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setIsUpdating(true);
    try {
      const sanitizedAssessments = editForm.assessments.map((a) => ({
        name: a.name.trim(),
        score: parseFloat(a.score),
        maxScore: parseFloat(a.maxScore),
        weightage: parseFloat(a.weightage),
      }));

      const res = await fetch(`/api/history/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseName: editForm.courseName.trim() || 'General Coursework',
          semester: editForm.semester.trim() || 'Current Semester',
          mode: editForm.mode,
          assessments: sanitizedAssessments,
          predictedGrade: finalGrade,
          targetGrade: editForm.mode === 'target_planner' && editForm.targetGrade ? Number(editForm.targetGrade) : null,
          requiredFinalScore: editForm.mode === 'target_planner' && editForm.targetGrade && editForm.remainingWeight ? calculateRequiredFinalScore({
            assessments: sanitizedAssessments,
            targetGrade: editForm.targetGrade,
            remainingWeight: editForm.remainingWeight,
          }).requiredFinalScore : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Audit updated successfully!');
        setMessageType('success');
        setEditingItem(null);
        fetchHistory();
      } else {
        alert(data.message || 'Failed to update audit.');
      }
    } catch (err) {
      console.error('Update audit error:', err);
      alert('Network error while updating audit.');
    } finally {
      setIsUpdating(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 4000);
    }
  };

  // Distinct semesters for dropdown filter
  const uniqueSemesters = Array.from(new Set(predictions.map((p) => p.semester).filter(Boolean)));

  // Filter & Search Logic
  const filteredPredictions = predictions.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const course = (p.courseName || '').toLowerCase();
    const semester = (p.semester || '').toLowerCase();
    const grade = String(p.predictedGrade || '');

    // Search filter
    const matchesSearch = !term || course.includes(term) || semester.includes(term) || grade.includes(term);

    // Semester filter
    const matchesSemester = filterSemester === 'all' || p.semester === filterSemester;

    // Mode filter
    const matchesMode =
      filterMode === 'all' ||
      (filterMode === 'weighted' && p.mode !== 'target_planner') ||
      (filterMode === 'target_planner' && p.mode === 'target_planner');

    // Grade band filter
    const numGrade = Number(p.predictedGrade) || 0;
    let matchesGrade = true;
    if (filterGrade === 'distinction') matchesGrade = numGrade >= 83;
    else if (filterGrade === 'merit') matchesGrade = numGrade >= 71 && numGrade < 83;
    else if (filterGrade === 'pass') matchesGrade = numGrade >= 60 && numGrade < 71;
    else if (filterGrade === 'warning') matchesGrade = numGrade < 60;

    return matchesSearch && matchesSemester && matchesMode && matchesGrade;
  });

  // Sort logic
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'highest') return Number(b.predictedGrade) - Number(a.predictedGrade);
    if (sortBy === 'lowest') return Number(a.predictedGrade) - Number(b.predictedGrade);
    return 0;
  });

  // KPI calculations
  const totalCount = predictions.length;
  const avgGrade =
    totalCount > 0
      ? (predictions.reduce((acc, p) => acc + (Number(p.predictedGrade) || 0), 0) / totalCount).toFixed(1)
      : '0';
  const avgCgpa10 = (Number(avgGrade) / 10).toFixed(2);

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterSemester('all');
    setFilterMode('all');
    setFilterGrade('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchTerm || filterSemester !== 'all' || filterMode !== 'all' || filterGrade !== 'all' || sortBy !== 'newest';

  if (!isClient) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading Academic History...</h2>
      </div>
    );
  }

  // Items to display in print mode (either single selected item, or all filtered items)
  const printItems = printSingleItem ? [printSingleItem] : sortedPredictions;

  return (
    <>
      <Navbar />

      {/* Official Printable Header (Visible only when printed to PDF / Paper) */}
      <div className="printOnlyHeader">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', color: '#000' }}>
          🎓 GradeTrack Official Academic Performance Audit
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#444', marginBottom: '16px' }}>
          Generated on: {new Date().toLocaleDateString()} | Scope: {printSingleItem ? `Individual Course Audit (${printSingleItem.courseName})` : `Full Cumulative Audit (${sortedPredictions.length} Records)`}
        </p>
      </div>

      <main className="container">
        {/* Header Row (no-print) */}
        <div className="historyHeaderRow no-print">
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Academic Audit & History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Review, edit, and export course calculations with 10.0 CGPA conversion.
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handlePrintAll} className="btnSecondary no-print">
              <span>🖨️</span> Print Full Audit Report
            </button>
            <Link href="/predict" className="btnPrimary no-print">
              <span>➕</span> New Calculation
            </Link>
          </div>
        </div>

        {message && (
          <div className={`message no-print ${messageType === 'success' ? 'success' : 'error'}`}>
            <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Quick Stats Summary (no-print) */}
        <div className="kpiGrid no-print" style={{ marginBottom: '24px' }}>
          <div className="kpiCard" style={{ padding: '16px 20px' }}>
            <div className="kpiLabel">Total Calculations Recorded</div>
            <div className="kpiValue" style={{ fontSize: '1.8rem', color: '#818cf8' }}>
              {totalCount}
            </div>
          </div>
          <div className="kpiCard" style={{ padding: '16px 20px' }}>
            <div className="kpiLabel">Cumulative Average Score</div>
            <div className="kpiValue" style={{ fontSize: '1.8rem', color: '#10b981' }}>
              {totalCount > 0 ? `${avgGrade}%` : '—'}
            </div>
          </div>
          <div className="kpiCard" style={{ padding: '16px 20px' }}>
            <div className="kpiLabel">Projected CGPA (10.0 Scale)</div>
            <div className="kpiValue" style={{ fontSize: '1.8rem', color: '#38bdf8' }}>
              {totalCount > 0 ? `${avgCgpa10} / 10.0` : '—'}
            </div>
          </div>
        </div>

        {/* Search & Multi-Filter Bar (no-print) */}
        <div className="searchFilterBar no-print">
          <div style={{ display: 'flex', flex: 1, minWidth: '240px', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input
              type="text"
              className="searchInput"
              placeholder="Search by Course Name, Semester, or Grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Semester Filter */}
            <select
              className="filterDropdown"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              aria-label="Filter by Semester"
            >
              <option value="all">🗓️ All Semesters</option>
              {uniqueSemesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Mode Filter */}
            <select
              className="filterDropdown"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              aria-label="Filter by Type"
            >
              <option value="all">⚙️ All Types</option>
              <option value="weighted">Weighted Calculator</option>
              <option value="target_planner">Target Planner</option>
            </select>

            {/* Grade Band Filter */}
            <select
              className="filterDropdown"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              aria-label="Filter by Grade"
            >
              <option value="all">🏆 All Grades</option>
              <option value="distinction">Distinction (83%+)</option>
              <option value="merit">Merit (71 - 82%)</option>
              <option value="pass">Pass (60 - 70%)</option>
              <option value="warning">Warning (&lt; 60%)</option>
            </select>

            {/* Sort Order */}
            <select
              className="filterDropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort Order"
            >
              <option value="newest">⏱️ Newest First</option>
              <option value="oldest">⌛ Oldest First</option>
              <option value="highest">📈 Highest Grade</option>
              <option value="lowest">📉 Lowest Grade</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="deleteItemBtn no-print"
                style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {loading && <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading prediction archive...</p>}
        {error && <p className="message error">Error: {error}</p>}

        {!loading && !error && predictions.length === 0 && (
          <div className="infoCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Grade Calculations Recorded</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '460px', margin: '0 auto 20px' }}>
              You haven&apos;t saved any course grade calculations yet. Use the Calculator &amp; Planner to model your first course.
            </p>
            <Link href="/predict" className="btnPrimary">
              Launch Grade Calculator ➔
            </Link>
          </div>
        )}

        {/* Prediction Cards List (Used for both UI and Printing) */}
        {!loading && !error && (
          <ul className="historyList">
            {printItems.map((prediction) => {
              const numericGrade = Number(prediction.predictedGrade) || 0;
              const details = getGradeDetails(numericGrade);
              const isTargetPlanner = prediction.mode === 'target_planner';

              return (
                <li key={prediction._id} className="historyCard">
                  <div className="historyCardHeader">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h2 className="historyCourseTitle">
                          {prediction.courseName || 'General Coursework'}
                        </h2>
                        <span
                          className="gradeLetterBadge"
                          style={{ backgroundColor: details.color, fontSize: '0.85rem' }}
                        >
                          {details.letter}
                        </span>
                        <span
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          CGPA: {details.cgpa10}
                        </span>
                        {isTargetPlanner && (
                          <span
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            Target Planner
                          </span>
                        )}
                      </div>
                      <div className="historyMetaText">
                        <span>🗓️ {prediction.semester || 'Current Semester'}</span>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>Recorded: {new Date(prediction.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="historyBadgeGroup">
                      <div className="gradeScorePill">
                        {numericGrade.toFixed(2)}%
                      </div>

                      {/* Card Action Buttons (no-print) */}
                      <div className="no-print" style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(prediction)}
                          className="actionBtn printBtn"
                          title="Print this particular course audit to PDF"
                        >
                          🖨️ Print
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(prediction)}
                          className="actionBtn editBtn"
                          title="Edit this audit"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prediction._id)}
                          className="actionBtn deleteBtn"
                          title="Delete this record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Target Planner Summary if present */}
                  {isTargetPlanner && prediction.targetGrade && (
                    <div
                      style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 16px',
                        marginBottom: '14px',
                        fontSize: '0.88rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <span>
                        🎯 Course Goal: <strong>{prediction.targetGrade}%</strong>
                      </span>
                      {prediction.requiredFinalScore !== null && (
                        <span>
                          📝 Required on Remaining Exam: <strong>{prediction.requiredFinalScore}%</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Assessment Breakdown Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="detailsTable">
                      <thead>
                        <tr>
                          <th>Assessment Name</th>
                          <th>Score Earned</th>
                          <th>Max Score</th>
                          <th>Weightage (%)</th>
                          <th>Contribution to Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prediction.assessments &&
                          prediction.assessments.map((a, idx) => {
                            const contrib = ((a.score / a.maxScore) * a.weightage).toFixed(2);
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                                <td>{a.score}</td>
                                <td>{a.maxScore}</td>
                                <td>{a.weightage}%</td>
                                <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>+{contrib}%</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && predictions.length > 0 && filteredPredictions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
              No calculations match your current search and filter criteria.
            </p>
            <button type="button" onClick={resetAllFilters} className="btnSecondary no-print">
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* =============================================================
          EDIT AUDIT MODAL
      ============================================================= */}
      {editingItem && (
        <div className="modalOverlay no-print">
          <div className="modalContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>✏️ Edit Academic Audit</h2>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="removeRowBtn"
                style={{ width: '32px', height: '32px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAudit}>
              <div className="courseMetaGrid" style={{ marginBottom: '16px' }}>
                <div className="formGroup">
                  <label>Course Code / Subject Name</label>
                  <input
                    type="text"
                    className="formInput"
                    value={editForm.courseName}
                    onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>Academic Term / Semester</label>
                  <input
                    type="text"
                    className="formInput"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    required
                  />
                </div>
              </div>

              {editForm.mode === 'target_planner' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="formGroup">
                    <label>Target Goal (%)</label>
                    <input
                      type="number"
                      className="formInput"
                      value={editForm.targetGrade}
                      onChange={(e) => setEditForm({ ...editForm, targetGrade: e.target.value })}
                    />
                  </div>
                  <div className="formGroup">
                    <label>Remaining Final Weight (%)</label>
                    <input
                      type="number"
                      className="formInput"
                      value={editForm.remainingWeight}
                      onChange={(e) => setEditForm({ ...editForm, remainingWeight: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Assessments in modal */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Evaluation Rows</label>
                  <button type="button" onClick={addEditAssessment} className="btnSecondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                    + Add Row
                  </button>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {editForm.assessments.map((a, idx) => (
                    <div key={idx} className="assessmentItemCard" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto', marginBottom: '8px' }}>
                      <div className="formGroup">
                        <input
                          type="text"
                          className="formInput"
                          placeholder="Name"
                          value={a.name}
                          onChange={(e) => handleEditAssessmentChange(idx, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="formGroup">
                        <input
                          type="number"
                          className="formInput"
                          placeholder="Score"
                          value={a.score}
                          onChange={(e) => handleEditAssessmentChange(idx, 'score', e.target.value)}
                          required
                        />
                      </div>
                      <div className="formGroup">
                        <input
                          type="number"
                          className="formInput"
                          placeholder="Max"
                          value={a.maxScore}
                          onChange={(e) => handleEditAssessmentChange(idx, 'maxScore', e.target.value)}
                          required
                        />
                      </div>
                      <div className="formGroup">
                        <input
                          type="number"
                          className="formInput"
                          placeholder="Weight %"
                          value={a.weightage}
                          onChange={(e) => handleEditAssessmentChange(idx, 'weightage', e.target.value)}
                          required
                        />
                      </div>
                      {editForm.assessments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditAssessment(idx)}
                          className="removeRowBtn"
                          style={{ height: '38px', width: '38px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recalculated Live Preview */}
              {(() => {
                const { finalGrade, totalWeight, details } = computeEditGrade();
                return (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>Total Weight: <strong>{totalWeight}%</strong></span>
                    <span>Recalculated Score: <strong style={{ color: details.color }}>{finalGrade}% ({details.letter})</strong></span>
                    <span>CGPA (10.0): <strong style={{ color: '#38bdf8' }}>{details.cgpa10}</strong></span>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btnSecondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btnPrimary"
                  style={{ flex: 2 }}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default HistoryPage;