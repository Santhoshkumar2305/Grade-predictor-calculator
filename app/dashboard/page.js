'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { getAuthToken } from '../../lib/auth';
import { GRADE_SCALE } from '../../utils/gradeUtils';

function DashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    avgGrade: 0,
    topGrade: 0,
    cgpa10: '0.00',
    status: 'Ready to Calculate',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    // Fetch user statistics from history
    fetch('/api/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.predictions) && data.predictions.length > 0) {
          const list = data.predictions;
          const total = list.length;
          const grades = list.map((p) => Number(p.predictedGrade) || 0);
          const sum = grades.reduce((a, b) => a + b, 0);
          const avg = Number((sum / total).toFixed(2));
          const max = Math.max(...grades);
          const cgpa10 = (avg / 10).toFixed(2);

          let status = 'Good Standing';
          if (avg >= 90) status = 'High Distinction';
          else if (avg >= 80) status = 'First Class Merit';
          else if (avg < 60) status = 'Needs Improvement';

          setStats({
            totalCount: total,
            avgGrade: avg,
            topGrade: Number(max.toFixed(2)),
            cgpa10,
            status,
          });
        }
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoadingStats(false));
  }, [router]);

  if (!isClient) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading Academic Command Center...</h2>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container">
        {/* Hero Section */}
        <section className="dashboardHero">
          <div>
            <h1 className="heroTitle">
              Welcome to <span>GradeTrack Command Center</span>
            </h1>
            <p className="heroSubtitle">
              Real-time academic performance calculation, target exam reverse solving, and 10.0 CGPA tracking for modern college courses.
            </p>
          </div>
          <div className="heroActionGroup">
            <Link href="/predict" className="btnPrimary">
              <span>🧮</span> Calculate & Plan
            </Link>
            <Link href="/visuals" className="btnSecondary">
              <span>📈</span> Visual Insights
            </Link>
          </div>
        </section>

        {/* Top KPI Metrics Row */}
        <section className="kpiGrid">
          <div className="kpiCard">
            <div className="kpiTop">
              <span className="kpiLabel">Average Calculated Score</span>
              <span className="kpiIcon">📈</span>
            </div>
            <div className="kpiValue" style={{ color: '#818cf8' }}>
              {loadingStats ? '...' : stats.totalCount > 0 ? `${stats.avgGrade}%` : '—'}
            </div>
            <div className="kpiSubtext">
              {stats.totalCount > 0 ? `Across ${stats.totalCount} course calculations` : 'No calculations saved yet'}
            </div>
          </div>

          <div className="kpiCard">
            <div className="kpiTop">
              <span className="kpiLabel">Projected CGPA (10.0 Scale)</span>
              <span className="kpiIcon">🎓</span>
            </div>
            <div className="kpiValue" style={{ color: '#10b981' }}>
              {loadingStats ? '...' : stats.totalCount > 0 ? `${stats.cgpa10} / 10.0` : '—'}
            </div>
            <div className="kpiSubtext">
              Standard 10-point collegiate cumulative grade point average
            </div>
          </div>

          <div className="kpiCard">
            <div className="kpiTop">
              <span className="kpiLabel">Highest Calculated Grade</span>
              <span className="kpiIcon">🏆</span>
            </div>
            <div className="kpiValue" style={{ color: '#f59e0b' }}>
              {loadingStats ? '...' : stats.totalCount > 0 ? `${stats.topGrade}%` : '—'}
            </div>
            <div className="kpiSubtext">
              Peak recorded performance across subjects
            </div>
          </div>

          <div className="kpiCard">
            <div className="kpiTop">
              <span className="kpiLabel">Academic Standing</span>
              <span className="kpiIcon">🛡️</span>
            </div>
            <div className="kpiValue" style={{ fontSize: '1.45rem', color: '#38bdf8' }}>
              {loadingStats ? '...' : stats.status}
            </div>
            <div className="kpiSubtext">
              Evaluation benchmark rating
            </div>
          </div>
        </section>

        {/* Feature Launchpad */}
        <section className="launchpadGrid">
          <div className="featureCard">
            <div className="featureCardHeader">
              <div className="featureCardIcon">⚖️</div>
              <h2 className="featureCardTitle">Weighted Grade Calculator</h2>
            </div>
            <p className="featureCardDesc">
              Enter assignments, lab reports, quizzes, and midterm weights to calculate your cumulative semester course standing and 10.0 CGPA in real-time.
            </p>
            <div className="featureBadgeList">
              <span className="featurePill">Dynamic Weight Allocator</span>
              <span className="featurePill">Validation Engine</span>
              <span className="featurePill">CGPA 10.0 Conversion</span>
            </div>
            <Link href="/predict" className="btnPrimary">
              Calculate Course Marks ➔
            </Link>
          </div>

          <div className="featureCard">
            <div className="featureCardHeader">
              <div className="featureCardIcon" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                🎯
              </div>
              <h2 className="featureCardTitle">Final Exam Target Solver</h2>
            </div>
            <p className="featureCardDesc">
              Set a target final grade (e.g. 85% for an A) and discover the exact minimum score required on your final exam to secure your academic goal.
            </p>
            <div className="featureBadgeList">
              <span className="featurePill">Reverse Optimization</span>
              <span className="featurePill">Feasibility Warnings</span>
              <span className="featurePill">Margin of Safety</span>
            </div>
            <Link href="/predict" className="btnPrimary" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }}>
              Solve Target Exam Score ➔
            </Link>
          </div>

          <div className="featureCard">
            <div className="featureCardHeader">
              <div className="featureCardIcon" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                📈
              </div>
              <h2 className="featureCardTitle">Visual Insights & Analytics</h2>
            </div>
            <p className="featureCardDesc">
              Explore interactive visual charts: Course CGPA Comparison bar charts, Assessment Weight Distribution breakdown, and Grade Band distribution.
            </p>
            <div className="featureBadgeList">
              <span className="featurePill">Performance Charts</span>
              <span className="featurePill">Weight Distribution</span>
              <span className="featurePill">Grade Bands</span>
            </div>
            <Link href="/visuals" className="btnSecondary">
              Explore Visual Insights ➔
            </Link>
          </div>
        </section>

        {/* Interactive Reference Matrix & Academic Strategy */}
        <section className="dashboardBottomGrid">
          <div className="infoCard">
            <h3 className="cardHeading">
              <span>📊</span> Academic Grading Matrix & Scale Reference
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px' }}>
              Standard collegiate scale used to convert continuous percentages into letter marks and 10.0 CGPA points:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="gradingMatrix">
                <thead>
                  <tr>
                    <th>Score Band</th>
                    <th>Letter</th>
                    <th>CGPA (10.0 Scale)</th>
                    <th>Academic Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADE_SCALE.map((item) => (
                    <tr key={item.letter}>
                      <td>{item.min}% – {item.max}%</td>
                      <td>
                        <span className="gradeLetterBadge" style={{ backgroundColor: item.color }}>
                          {item.letter}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.cgpa10}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="infoCard">
            <h3 className="cardHeading">
              <span>💡</span> High-Impact Exam Strategy
            </h3>
            <div className="tipList">
              <div className="tipItem">
                <span className="tipIcon">🎯</span>
                <div>
                  <strong>Prioritize High-Weight Assessments:</strong> A 5% improvement on a 40% final impacts your grade twice as much as a 10% gain on a 10% quiz.
                </div>
              </div>
              <div className="tipItem">
                <span className="tipIcon">🛡️</span>
                <div>
                  <strong>Factor in a 5% Safety Buffer:</strong> When calculating target exam scores, aim 5% higher than your mathematical minimum to absorb unexpected tough questions.
                </div>
              </div>
              <div className="tipItem">
                <span className="tipIcon">💾</span>
                <div>
                  <strong>Save Multiple Scenarios:</strong> Model both best-case and worst-case final exam scores to plan study hours effectively.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default DashboardPage;