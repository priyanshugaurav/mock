import axios from 'axios';

// Replace with your Vercel deployment URL once deployed.
// For local testing on Android Emulator, use 10.0.2.2:3001
const BASE_URL = 'http://10.0.2.2:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch the next question based on user ELO and topic.
 * @param {string} userId 
 * @param {string} topic 
 */
export const getNextQuestion = async (userId, topic = 'ratio') => {
  try {
    const response = await api.get('/questions/next', {
      params: { userId, topic }
    });
    return response.data;
  } catch (error) {
    console.error('API Error (getNextQuestion):', error.message);
    throw error;
  }
};

/**
 * Submit an answer and receive ELO updates.
 * @param {string} userId 
 * @param {string} questionId 
 * @param {boolean} isCorrect 
 * @param {number} timeTakenSec 
 */
export const submitAnswer = async (userId, questionId, isCorrect, timeTakenSec) => {
  try {
    const response = await api.post('/questions/answer', {
      userId,
      questionId,
      isCorrect,
      timeTakenSec
    });
    return response.data;
  } catch (error) {
    console.error('API Error (submitAnswer):', error.message);
    throw error;
  }
};

export default api;
