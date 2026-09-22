/**
 * Academic grade calculation, 10.0 CGPA scale conversion, and target solver utilities.
 */

export const GRADE_SCALE = [
  { min: 93, max: 100, letter: 'A+', cgpa10: '10.0', status: 'Distinction', color: '#10b981' },
  { min: 87, max: 92.99, letter: 'A', cgpa10: '9.0 - 9.9', status: 'First Class Exemplary', color: '#10b981' },
  { min: 83, max: 86.99, letter: 'A-', cgpa10: '8.3 - 8.9', status: 'First Class High', color: '#059669' },
  { min: 79, max: 82.99, letter: 'B+', cgpa10: '7.9 - 8.2', status: 'Above Average', color: '#3b82f6' },
  { min: 75, max: 78.99, letter: 'B', cgpa10: '7.5 - 7.8', status: 'Good Standing', color: '#3b82f6' },
  { min: 71, max: 74.99, letter: 'B-', cgpa10: '7.1 - 7.4', status: 'Satisfactory', color: '#6366f1' },
  { min: 67, max: 70.99, letter: 'C+', cgpa10: '6.7 - 7.0', status: 'Average', color: '#eab308' },
  { min: 63, max: 66.99, letter: 'C', cgpa10: '6.3 - 6.6', status: 'Marginal Pass', color: '#eab308' },
  { min: 60, max: 62.99, letter: 'C-', cgpa10: '6.0 - 6.2', status: 'Needs Improvement', color: '#f97316' },
  { min: 50, max: 59.99, letter: 'D', cgpa10: '5.0 - 5.9', status: 'Academic Warning', color: '#ef4444' },
  { min: 0, max: 49.99, letter: 'F', cgpa10: '0.0 - 4.9', status: 'Failing / Academic Probation', color: '#dc2626' },
];

/**
 * Maps a percentage (0 - 100) to its corresponding letter grade, 10.0 CGPA scale, and status.
 */
export function getGradeDetails(percentage) {
  const numeric = Math.max(0, Math.min(100, Number(percentage) || 0));
  const cgpaValue = (numeric / 10).toFixed(2);

  for (const grade of GRADE_SCALE) {
    if (numeric >= grade.min && numeric <= grade.max) {
      return {
        ...grade,
        percentage: numeric.toFixed(2),
        cgpa10: cgpaValue,
      };
    }
  }

  return {
    min: 0,
    max: 49.99,
    letter: 'F',
    cgpa10: cgpaValue,
    status: 'Failing',
    color: '#dc2626',
    percentage: numeric.toFixed(2),
  };
}

/**
 * Calculates what score is required on remaining coursework to achieve a target overall grade.
 * 
 * Formula:
 * Target = (CurrentWeightedScore + RequiredScore * RemainingWeight) / 100
 * => RequiredScore = (Target * 100 - CurrentWeightedScore) / RemainingWeight
 */
export function calculateRequiredFinalScore({ assessments, targetGrade, remainingWeight }) {
  const target = Number(targetGrade);
  const remWeight = Number(remainingWeight);

  if (isNaN(target) || target <= 0 || target > 100) {
    return { error: 'Target grade must be between 1 and 100%.' };
  }
  if (isNaN(remWeight) || remWeight <= 0 || remWeight > 100) {
    return { error: 'Remaining weightage must be greater than 0% and up to 100%.' };
  }

  // Calculate current earned weighted percentage points
  let currentWeightedScore = 0;
  let currentCompletedWeight = 0;

  if (Array.isArray(assessments)) {
    for (const item of assessments) {
      const score = parseFloat(item.score);
      const maxScore = parseFloat(item.maxScore);
      const weightage = parseFloat(item.weightage);

      if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0 && !isNaN(weightage) && weightage > 0) {
        currentWeightedScore += (score / maxScore) * weightage;
        currentCompletedWeight += weightage;
      }
    }
  }

  const totalCourseWeight = currentCompletedWeight + remWeight;
  if (totalCourseWeight > 100.01) {
    return {
      error: `Total weightage (${totalCourseWeight.toFixed(1)}%) exceeds 100%. Please adjust existing or remaining weightage.`,
    };
  }

  // Normalized to course scale
  const neededFromFinal = (target * (totalCourseWeight / 100)) - currentWeightedScore;
  const requiredPercentageOnFinal = (neededFromFinal / remWeight) * 100;
  const maxPossibleGrade = ((currentWeightedScore + (1.0 * remWeight)) / totalCourseWeight) * 100;

  let feasibility = 'achievable';
  let message = '';
  let color = '#10b981';

  if (requiredPercentageOnFinal <= 0) {
    feasibility = 'secured';
    message = `Congratulations! You have already locked in your target of ${target}%, even with a 0% on the final exam.`;
    color = '#10b981';
  } else if (requiredPercentageOnFinal <= 75) {
    feasibility = 'comfortably_achievable';
    message = `Target is comfortably achievable. You need at least ${requiredPercentageOnFinal.toFixed(1)}% on your remaining evaluations.`;
    color = '#10b981';
  } else if (requiredPercentageOnFinal <= 90) {
    feasibility = 'challenging';
    message = `Target is achievable with dedicated preparation. You need ${requiredPercentageOnFinal.toFixed(1)}% on your remaining evaluations.`;
    color = '#f59e0b';
  } else if (requiredPercentageOnFinal <= 100) {
    feasibility = 'demanding';
    message = `Target requires near-perfect performance. You need ${requiredPercentageOnFinal.toFixed(1)}% on the final evaluations.`;
    color = '#f97316';
  } else {
    feasibility = 'impossible';
    message = `Target mathematically impossible. It requires ${requiredPercentageOnFinal.toFixed(1)}% (scores cannot exceed 100%). The maximum possible grade you can achieve is ${maxPossibleGrade.toFixed(2)}%.`;
    color = '#ef4444';
  }

  return {
    targetGrade: target,
    currentWeightedScore: Number(currentWeightedScore.toFixed(2)),
    currentCompletedWeight: Number(currentCompletedWeight.toFixed(2)),
    remainingWeight: remWeight,
    requiredFinalScore: Number(requiredPercentageOnFinal.toFixed(2)),
    maxPossibleGrade: Number(maxPossibleGrade.toFixed(2)),
    feasibility,
    message,
    color,
  };
}
