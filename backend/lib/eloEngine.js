/**
 * ELO Calculation Engine
 * 
 * Standard ELO formula for updating ratings after a match (or question)
 * R' = R + K * (S - E)
 * 
 * R: Current Rating
 * K: K-factor (determines sensitivity)
 * S: Actual Score (1 for correct, 0 for wrong)
 * E: Expected Score
 */

const K_FACTOR_USER = 32;
const K_FACTOR_QUESTION = 16;

/**
 * Calculate expected score between user and question
 * @param {number} userElo 
 * @param {number} questionElo 
 */
function getExpectedScore(userElo, questionElo) {
  return 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
}

/**
 * Update user's ELO after an answer
 * @param {number} currentElo 
 * @param {number} questionElo 
 * @param {boolean} isCorrect 
 */
function updateUserElo(currentElo, questionElo, isCorrect) {
  const S = isCorrect ? 1 : 0;
  const E = getExpectedScore(currentElo, questionElo);
  return Math.round(currentElo + K_FACTOR_USER * (S - E));
}

/**
 * Update question's ELO based on user performance
 * (Optional: can make questions more difficult if too many people get them right)
 * @param {number} questionElo 
 * @param {number} userElo 
 * @param {boolean} isCorrect 
 */
function updateQuestionElo(questionElo, userElo, isCorrect) {
  const S = isCorrect ? 0 : 1; // Reverse: if user gets it correct, question ELO should potentially drop
  const E = getExpectedScore(questionElo, userElo);
  return Math.round(questionElo + K_FACTOR_QUESTION * (S - E));
}

/**
 * Select the next question ELO range based on current user ELO
 * @param {number} userElo 
 * @returns {object} { min, max }
 */
function getTargetEloRange(userElo) {
  return {
    min: userElo - 200,
    max: userElo + 200
  };
}

module.exports = {
  updateUserElo,
  updateQuestionElo,
  getTargetEloRange,
  getExpectedScore
};
