'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { getAuthToken } from '../../lib/auth';
import { getGradeDetails } from '../../utils/gradeUtils';

function VisualsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVisualsData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data && Array.isArray(data.predictions)) {
        setHistoryData(data.predictions);
      } else if (res.status === 401) {
        router.replace('/login');
      } else {
        setHistoryData([]);
        if (!res.ok) {
          setError(data.message || 'Failed to load visual insights.');
        }
      }
    } catch (err) {
      console.error('Visuals history fetch error:', err);
      setError('An unexpected error occurred while loading visual insights.');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setIsClient(true);
    fetchVisualsData();
  }, [fetchVisualsData]);

  if (!isClient) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading Academic Visual Insights...</h2>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Data Aggregations for the Visualizations (Only applied to real data)
  // -------------------------------------------------------------
  const hasData = historyData.length > 0;

  // Visualization 1: Course Performance & 10.0 CGPA
  const barData = hasData
    ? historyData.map((item) => {
        const score = Number(item.predictedGrade) || 0;
        const details = getGradeDetails(score);
        return {
          id: item._id,
          name: item.courseName || 'General Course',
          shortName: (item.courseName || 'Course').split('-')[0].trim().slice(0, 10),
          score,
          cgpa10: details.cgpa10,
          letter: details.letter,
          color: details.color,
        };
      })
    : [];

  // Visualization 2: Cumulative 10.0 CGPA Progression Trajectory
  const timeOrderedRecords = hasData
    ? [...historyData].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB) {
          return timeA - timeB; // Ascending time order: first created first
        }
        return 0;
      })
    : [];

  // Fallback: If createdAt is missing in records, reverse historyData since API sorts by newest-first
  const chronologicalTrajectoryRecords =
    hasData && timeOrderedRecords.length > 1 && timeOrderedRecords.every((r) => !r.createdAt)
      ? [...historyData].reverse()
      : timeOrderedRecords;

  const trajectoryData = hasData
    ? chronologicalTrajectoryRecords.map((item, idx) => {
        const sublist = chronologicalTrajectoryRecords.slice(0, idx + 1);
        const totalScore = sublist.reduce((sum, r) => sum + (Number(r.predictedGrade) || 0), 0);
        const runningCgpa = (totalScore / (idx + 1) / 10).toFixed(2);
        const score = Number(item.predictedGrade) || 0;
        return {
          id: item._id,
          name: item.courseName || `Course ${idx + 1}`,
          shortName: (item.courseName || `C${idx + 1}`).split('-')[0].trim().slice(0, 9),
          score,
          runningCgpa,
          runningCgpaNum: Number(runningCgpa),
        };
      })
    : [];

  const startingCgpa = trajectoryData.length > 0 ? trajectoryData[0].runningCgpa : '0.00';
  const finalCumulativeCgpa =
    trajectoryData.length > 0 ? trajectoryData[trajectoryData.length - 1].runningCgpa : '0.00';
  const deltaCgpa = (Number(finalCumulativeCgpa) - Number(startingCgpa)).toFixed(2);

  // Trajectory SVG Points Calculation
  const trajXStart = 45;
  const trajXEnd = 465;
  const trajYBase = 165;
  const trajYTop = 25;
  const trajYRange = trajYBase - trajYTop;

  const trajPoints = trajectoryData.map((pt, idx) => {
    const count = trajectoryData.length;
    const x = count <= 1 ? 255 : trajXStart + idx * ((trajXEnd - trajXStart) / (count - 1));
    const y = trajYBase - Math.min(10, Math.max(0, pt.runningCgpaNum)) * (trajYRange / 10);
    return { ...pt, x, y };
  });

  const trajLinePath =
    trajPoints.length === 1
      ? `M ${trajXStart} ${trajPoints[0].y.toFixed(1)} L ${trajXEnd} ${trajPoints[0].y.toFixed(1)}`
      : trajPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const trajAreaPath =
    trajPoints.length === 1
      ? `M ${trajXStart} ${trajPoints[0].y.toFixed(1)} L ${trajXEnd} ${trajPoints[0].y.toFixed(1)} L ${trajXEnd} ${trajYBase} L ${trajXStart} ${trajYBase} Z`
      : trajPoints.length > 1
      ? `${trajLinePath} L ${trajPoints[trajPoints.length - 1].x.toFixed(1)} ${trajYBase} L ${trajPoints[0].x.toFixed(1)} ${trajYBase} Z`
      : '';

  // Visualization 3: Academic Standing & Grade Band Breakdown
  const bandCounts = {
    Distinction: historyData.filter((r) => (Number(r.predictedGrade) || 0) >= 83).length,
    Merit: historyData.filter((r) => {
      const g = Number(r.predictedGrade) || 0;
      return g >= 71 && g < 83;
    }).length,
    Pass: historyData.filter((r) => {
      const g = Number(r.predictedGrade) || 0;
      return g >= 60 && g < 71;
    }).length,
    Warning: historyData.filter((r) => (Number(r.predictedGrade) || 0) < 60).length,
  };

  const totalCourses = historyData.length || 1;
  const highestCourse = hasData
    ? [...historyData].sort((a, b) => Number(b.predictedGrade) - Number(a.predictedGrade))[0]
    : null;

  return (
    <>
      <Navbar />
      <main className="container">
        {/* Header Row */}
        <div className="historyHeaderRow">
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              📈 Visual Insights &amp; Academic Analytics
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Interactive visual analytics comparing course standing, evaluation weight distributions, and 10.0 CGPA bands.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {hasData && (
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {historyData.length} Course{historyData.length !== 1 ? 's' : ''} Analyzed
              </span>
            )}
            <Link href="/predict" className="btnPrimary">
              <span>🧮</span> Calculate New Course
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="infoCard" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>⏳</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Loading Academic Visual Insights...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Fetching your course assessments and performance calculations...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="infoCard"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              marginTop: '20px',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#ef4444' }}>
              Unable to Load Analytics
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', maxWidth: '480px', margin: '0 auto 18px' }}>
              {error}
            </p>
            <button
              onClick={fetchVisualsData}
              className="btnPrimary"
              style={{ padding: '8px 20px', fontSize: '0.9rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State: Only shown when there are NO analytics details recorded */}
        {!loading && !error && !hasData && (
          <div
            className="infoCard"
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              marginTop: '16px',
              background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                boxShadow: '0 0 30px -5px rgba(99, 102, 241, 0.3)',
              }}
            >
              📊
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
              No Academic Visuals Available Yet
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                maxWidth: '520px',
                margin: '0 auto 26px',
                lineHeight: 1.6,
              }}
            >
              No calculation details found. You haven&apos;t saved any course grade calculations yet. Interactive visual analytics, 10.0 CGPA progression trajectories, and grade band distributions will automatically appear here once you calculate your courses.
            </p>

            <Link
              href="/predict"
              className="btnPrimary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                fontSize: '0.98rem',
                fontWeight: 600,
              }}
            >
              <span>🧮</span> Calculate Your First Course ➔
            </Link>

            {/* Visual Insights Feature Preview Highlights */}
            <div
              style={{
                marginTop: '48px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                paddingTop: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📊</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Course Standing Comparison
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Side-by-side percentage and 10.0 CGPA breakdown comparing each subject against Distinction and Pass benchmarks.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📈</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Cumulative CGPA Trajectory
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Chronological momentum tracking your cumulative collegiate average evolution from first to latest course.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Grade Band Distribution
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Categorization into Distinction, Merit, Pass, and Academic Warning tiers with your top-performing subject highlight.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            REAL ANALYTICS SECTIONS (Only rendered when hasData is true)
        ============================================================= */}
        {!loading && !error && hasData && (
          <>
            {/* VISUALIZATION 1: Course Performance & 10.0 CGPA Comparison (Bar Chart) */}
            <section className="infoCard" style={{ marginBottom: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>📊</span> 1. Course Performance &amp; 10.0 CGPA Comparison
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Side-by-side calculated percentage score and 10-point CGPA rating per subject.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '2px', background: '#10b981', display: 'inline-block' }} />{' '}
                    Distinction (83% / 8.3 CGPA)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '2px', background: '#f59e0b', display: 'inline-block' }} />{' '}
                    Pass Benchmark (60% / 6.0 CGPA)
                  </span>
                </div>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
                <div style={{ minWidth: '550px', height: '280px', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 600 260" preserveAspectRatio="none">
                    {/* Horizontal Grid lines */}
                    <line x1="50" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <line x1="50" y1="70" x2="580" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <line x1="50" y1="120" x2="580" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <line x1="50" y1="170" x2="580" y2="170" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <line x1="50" y1="220" x2="580" y2="220" stroke="rgba(255,255,255,0.15)" />

                    {/* Y-Axis scale labels */}
                    <text x="40" y="24" fill="#6b7280" fontSize="10" textAnchor="end">
                      100%
                    </text>
                    <text x="40" y="74" fill="#6b7280" fontSize="10" textAnchor="end">
                      75%
                    </text>
                    <text x="40" y="124" fill="#6b7280" fontSize="10" textAnchor="end">
                      50%
                    </text>
                    <text x="40" y="174" fill="#6b7280" fontSize="10" textAnchor="end">
                      25%
                    </text>
                    <text x="40" y="224" fill="#6b7280" fontSize="10" textAnchor="end">
                      0%
                    </text>

                    {/* Distinction Threshold Line (83% -> Y = 220 - 83 * 2 = 54) */}
                    <line
                      x1="50"
                      y1="54"
                      x2="580"
                      y2="54"
                      stroke="#10b981"
                      strokeDasharray="4"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />

                    {/* Pass Threshold Line (60% -> Y = 220 - 60 * 2 = 100) */}
                    <line
                      x1="50"
                      y1="100"
                      x2="580"
                      y2="100"
                      stroke="#f59e0b"
                      strokeDasharray="4"
                      strokeWidth="1.5"
                      opacity="0.5"
                    />

                    {/* Bars */}
                    {barData.map((item, idx) => {
                      const barCount = barData.length;
                      const availableWidth = 530;
                      const slotWidth = availableWidth / barCount;
                      const barWidth = Math.min(50, slotWidth * 0.55);
                      const x = 50 + idx * slotWidth + (slotWidth - barWidth) / 2;
                      const barHeight = Math.max(4, (item.score / 100) * 200);
                      const y = 220 - barHeight;

                      return (
                        <g key={item.id}>
                          {/* Bar Background Column */}
                          <rect
                            x={x}
                            y={20}
                            width={barWidth}
                            height={200}
                            fill="rgba(255,255,255,0.02)"
                            rx="4"
                          />

                          {/* Actual Score Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={`url(#barGrad-${idx})`}
                            rx="4"
                          />

                          {/* Bar Gradient */}
                          <defs>
                            <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                              <stop offset="100%" stopColor={item.color} stopOpacity="0.5" />
                            </linearGradient>
                          </defs>

                          {/* Score Value Top Text */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {item.score}%
                          </text>

                          {/* Letter & CGPA Badge */}
                          <text
                            x={x + barWidth / 2}
                            y={238}
                            fill="#38bdf8"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            {item.cgpa10} CGPA
                          </text>

                          {/* Course Name Label */}
                          <text
                            x={x + barWidth / 2}
                            y={252}
                            fill="#9ca3af"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {item.shortName}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </section>

            {/* Bottom Split Grid for Visualizations 2 and 3 */}
            <div className="dashboardBottomGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* VISUALIZATION 2: Cumulative 10.0 CGPA Progression Trajectory */}
              <section className="infoCard">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>📈</span> 2. Cumulative 10.0 CGPA Trajectory
                  </h2>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor:
                        Number(deltaCgpa) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: Number(deltaCgpa) >= 0 ? '#10b981' : '#ef4444',
                      border: `1px solid ${
                        Number(deltaCgpa) >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                      }`,
                    }}
                  >
                    {Number(deltaCgpa) >= 0 ? `▲ +${deltaCgpa} Momentum` : `▼ ${deltaCgpa} Momentum`}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  Chronological cumulative average progression from your first created course calculation to
                  latest on the 10.0 CGPA scale.
                </p>

                {/* Quick Trajectory Stat Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Starting (1st Created)
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8' }}>{startingCgpa}</div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#a5b4fc', textTransform: 'uppercase' }}>
                      Current Cumulative
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#818cf8' }}>
                      {finalCumulativeCgpa}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7', textTransform: 'uppercase' }}>
                      Distinction Goal
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>8.00+</div>
                  </div>
                </div>

                {/* Responsive SVG Area & Line Chart */}
                <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
                  <div style={{ minWidth: '320px', height: '190px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 500 195" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trajAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.38" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="trajLineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="50%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {/* 10.0 CGPA -> y = 25 */}
                      <line x1="45" y1="25" x2="475" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                      <text x="38" y="29" fill="#6b7280" fontSize="9" textAnchor="end">
                        10.0
                      </text>

                      {/* 8.0 CGPA Distinction Benchmark -> y = 53 */}
                      <line
                        x1="45"
                        y1="53"
                        x2="475"
                        y2="53"
                        stroke="#10b981"
                        strokeDasharray="3"
                        strokeWidth="1.2"
                        opacity="0.5"
                      />
                      <text x="38" y="57" fill="#10b981" fontSize="9" textAnchor="end">
                        8.0
                      </text>

                      {/* 6.0 CGPA Pass Benchmark -> y = 81 */}
                      <line
                        x1="45"
                        y1="81"
                        x2="475"
                        y2="81"
                        stroke="#f59e0b"
                        strokeDasharray="3"
                        strokeWidth="1.2"
                        opacity="0.4"
                      />
                      <text x="38" y="85" fill="#f59e0b" fontSize="9" textAnchor="end">
                        6.0
                      </text>

                      {/* 4.0 CGPA -> y = 109 */}
                      <line
                        x1="45"
                        y1="109"
                        x2="475"
                        y2="109"
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3"
                      />
                      <text x="38" y="113" fill="#6b7280" fontSize="9" textAnchor="end">
                        4.0
                      </text>

                      {/* Baseline -> y = 165 */}
                      <line x1="45" y1="165" x2="475" y2="165" stroke="rgba(255,255,255,0.15)" />
                      <text x="38" y="169" fill="#6b7280" fontSize="9" textAnchor="end">
                        0.0
                      </text>

                      {/* Area Fill */}
                      {trajAreaPath && <path d={trajAreaPath} fill="url(#trajAreaGrad)" />}

                      {/* Line Stroke */}
                      {trajLinePath && (
                        <path
                          d={trajLinePath}
                          fill="none"
                          stroke="url(#trajLineGrad)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data Points */}
                      {trajPoints.map((pt, idx) => (
                        <g key={pt.id || idx}>
                          {/* Vertical reference guideline */}
                          <line
                            x1={pt.x}
                            y1={pt.y}
                            x2={pt.x}
                            y2="165"
                            stroke="rgba(99, 102, 241, 0.2)"
                            strokeDasharray="2"
                          />

                          {/* Outer pulse circle */}
                          <circle cx={pt.x} cy={pt.y} r="7" fill="rgba(99, 102, 241, 0.25)" />

                          {/* Point marker */}
                          <circle cx={pt.x} cy={pt.y} r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />

                          {/* Running CGPA badge */}
                          <text
                            x={pt.x}
                            y={pt.y - 9}
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="700"
                            textAnchor="middle"
                          >
                            {pt.runningCgpa}
                          </text>

                          {/* Subject Name at Bottom */}
                          <text x={pt.x} y="182" fill="#9ca3af" fontSize="9" textAnchor="middle">
                            {pt.shortName}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </section>

              {/* VISUALIZATION 3: Academic Standing & Grade Band Breakdown */}
              <section className="infoCard">
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🏆</span> 3. Academic Grade Band Distribution
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Classification of courses into academic performance tiers on the 10.0 CGPA scale.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Distinction */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        🌟 Distinction (83% - 100% / 8.3 - 10.0 CGPA)
                      </span>
                      <strong>
                        {bandCounts.Distinction} course{bandCounts.Distinction !== 1 ? 's' : ''}
                      </strong>
                    </div>
                    <div className="progressBarTrack">
                      <div
                        className="progressBarFill"
                        style={{
                          width: `${(bandCounts.Distinction / totalCourses) * 100}%`,
                          backgroundColor: '#10b981',
                        }}
                      />
                    </div>
                  </div>

                  {/* Merit */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                        🔷 Merit / Good Standing (71% - 82.9% / 7.1 - 8.2 CGPA)
                      </span>
                      <strong>
                        {bandCounts.Merit} course{bandCounts.Merit !== 1 ? 's' : ''}
                      </strong>
                    </div>
                    <div className="progressBarTrack">
                      <div
                        className="progressBarFill"
                        style={{
                          width: `${(bandCounts.Merit / totalCourses) * 100}%`,
                          backgroundColor: '#3b82f6',
                        }}
                      />
                    </div>
                  </div>

                  {/* Pass */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#eab308', fontWeight: 600 }}>
                        🔶 Pass / Average (60% - 70.9% / 6.0 - 7.0 CGPA)
                      </span>
                      <strong>
                        {bandCounts.Pass} course{bandCounts.Pass !== 1 ? 's' : ''}
                      </strong>
                    </div>
                    <div className="progressBarTrack">
                      <div
                        className="progressBarFill"
                        style={{
                          width: `${(bandCounts.Pass / totalCourses) * 100}%`,
                          backgroundColor: '#eab308',
                        }}
                      />
                    </div>
                  </div>

                  {/* Warning */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        🛑 Academic Warning (&lt; 60% / &lt; 6.0 CGPA)
                      </span>
                      <strong>
                        {bandCounts.Warning} course{bandCounts.Warning !== 1 ? 's' : ''}
                      </strong>
                    </div>
                    <div className="progressBarTrack">
                      <div
                        className="progressBarFill"
                        style={{
                          width: `${(bandCounts.Warning / totalCourses) * 100}%`,
                          backgroundColor: '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Summary Pill at bottom */}
                {highestCourse && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Top Performing Course:</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {highestCourse.courseName} ({Number(highestCourse.predictedGrade).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default VisualsPage;
