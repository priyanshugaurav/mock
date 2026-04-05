const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { updateUserElo, updateQuestionElo, getTargetEloRange } = require('../lib/eloEngine');
const { generateNvidiaCompletion } = require('../lib/nvidia');
const { getFollowUpQuestions, getProgressionQuestion } = require('../lib/questionGraph');
const { QUESTION_GENERATION_PROMPT } = require('../prompts/templates');
const RatioTemplates = require('../lib/templates/RatioTemplates');

const app = express();
app.use(cors());
app.use(express.json());

// ─── UTILS ─────────────────────────────────────────────────────────

async function getUserProfile(userId) {
  // Gracefully handle guest/anonymous users
  if (!userId || userId === 'anonymous' || !/^[0-9a-fA-F-]{36}$/.test(userId)) {
    return { id: 'anonymous', elo_rating: 1200 };
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    try {
      // Auto-create profile if missing (only for valid Auth UUIDs)
      const { data: created } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId, elo_rating: 1200 })
        .select()
        .single();
      return created || { id: userId, elo_rating: 1200 };
    } catch (err) {
      return { id: userId, elo_rating: 1200 };
    }
  }
  return data;
}

async function getLastAnswer(userId) {
  const { data } = await supabaseAdmin
    .from('user_question_history')
    .select('*, questions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

// ─── API ENDPOINTS ──────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/generate
 * LIGHTNING FAST MOCK ENGINE
 * Procedurally generates questions on the fly without DB or AI dependencies.
 */
app.get('/api/generate', (req, res) => {
  const { topic = 'ratio', count = 5 } = req.query;
  const questions = [];
  const start = performance.now();

  try {
    for (let i = 0; i < parseInt(count); i++) {
      if (topic === 'ratio') {
        questions.push(RatioTemplates.generate());
      } else {
        questions.push(RatioTemplates.generate()); // Fallback to ratio
      }
    }
    const end = performance.now();
    
    // Add artificial delay logic if requested (for testing), otherwise blazing fast
    res.json({
      success: true,
      count: questions.length,
      generationTimeMs: Math.round(end - start),
      questions
    });
  } catch (error) {
    console.error('Procedural Generation Error:', error);
    res.status(500).json({ error: 'Engine failed to generate questions' });
  }
});

/**
 * GET /api/questions/next
 * 
 * Adaptive question selection:
 * - If last answer was WRONG → serve follow-up from graph (or AI-generate)
 * - If last answer was CORRECT → serve harder question
 * - If no history → serve from ELO range
 */
app.get('/api/questions/next', async (req, res) => {
  const { topic, userId, excludeIds } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const excludeList = excludeIds ? excludeIds.split(',') : [];

  try {
    const profile = await getUserProfile(userId);
    const userElo = profile.elo_rating || 1200;

    // Check last answer for adaptive routing
    const lastAnswer = await getLastAnswer(userId);

    // ── ADAPTIVE BRANCH: Wrong answer → follow-up from graph ──
    if (lastAnswer && !lastAnswer.is_correct && lastAnswer.questions) {
      const followUps = await getFollowUpQuestions(
        lastAnswer.question_id,
        lastAnswer.questions
      );

      if (followUps && followUps.length > 0) {
        // Filter out questions the user has already answered
        const { data: history } = await supabaseAdmin
          .from('user_question_history')
          .select('question_id')
          .eq('user_id', userId);

        const answeredIds = new Set([...(history || []).map(h => h.question_id), ...excludeList]);
        const unseen = followUps.filter(q => !answeredIds.has(q.id));

        if (unseen.length > 0) {
          return res.json({
            question: unseen[0],
            source: 'graph_followup',
            userElo
          });
        }
      }
    }

    // ── ADAPTIVE BRANCH: Correct answer → progression ──
    if (lastAnswer && lastAnswer.is_correct && lastAnswer.questions) {
      const harder = await getProgressionQuestion(lastAnswer.questions);
      if (harder) {
        return res.json({
          question: harder,
          source: 'progression',
          userElo
        });
      }
    }

    // ── DEFAULT: ELO-range based selection ──
    const range = getTargetEloRange(userElo);
    let query = supabaseAdmin
      .from('questions')
      .select('*')
      .gte('elo_rating', range.min)
      .lte('elo_rating', range.max);

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic);
    }

    const { data: questions, error } = await query.limit(20);
    if (error) throw error;

    if (!questions || questions.length === 0) {
      // Last resort: generate with AI on-the-fly
      const t = topic || 'ratio';
      const prompt = QUESTION_GENERATION_PROMPT(t, 'General', userElo);
      const raw = await generateNvidiaCompletion(
        [{ role: 'user', content: prompt }],
        'meta/llama-3.1-70b-instruct'
      );
      const parsed = JSON.parse(raw);

      const { data: inserted } = await supabaseAdmin
        .from('questions')
        .insert({
          topic: t,
          subtopic: 'General',
          question: parsed.question_text || parsed.question,
          options: parsed.options,
          correct_index: parsed.correct_index,
          elo_rating: userElo,
          latex_steps: parsed.latex_steps || [],
          difficulty: parsed.difficulty || 'medium',
          tags: parsed.tags || [t],
          ai_generated: true
        })
        .select()
        .single();

      return res.json({
        question: inserted,
        source: 'ai_generated',
        userElo
      });
    }

    // Filter out already-answered questions
    const { data: history } = await supabaseAdmin
      .from('user_question_history')
      .select('question_id')
      .eq('user_id', userId);

    const answeredIds = new Set([...(history || []).map(h => h.question_id), ...excludeList]);
    const unseen = questions.filter(q => !answeredIds.has(q.id));

    const pool = unseen.length > 0 ? unseen : questions;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    res.json({ question: picked, source: 'db', userElo });

  } catch (err) {
    console.error('Next Question Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/questions/answer
 * Record answer, update ELOs, trigger background follow-up generation
 */
app.post('/api/questions/answer', async (req, res) => {
  const { userId, questionId, isCorrect, timeTakenSec } = req.body;

  if (!userId || !questionId) {
    return res.status(400).json({ error: 'Missing userId or questionId' });
  }

  try {
    const profile = await getUserProfile(userId);
    const userElo = profile.elo_rating;

    const { data: question, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (qErr) throw qErr;

    // Calculate new ELOs
    const newUserElo = updateUserElo(userElo, question.elo_rating, isCorrect);
    const newQuestionElo = updateQuestionElo(question.elo_rating, userElo, isCorrect);

    // Save history
    await supabaseAdmin
      .from('user_question_history')
      .insert({
        user_id: userId,
        question_id: questionId,
        is_correct: isCorrect,
        time_taken_sec: timeTakenSec || 0,
        user_elo_at_time: userElo
      });

    // Update user profile ELO
    await supabaseAdmin
      .from('profiles')
      .update({ elo_rating: newUserElo, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Update question ELO
    await supabaseAdmin
      .from('questions')
      .update({ elo_rating: newQuestionElo })
      .eq('id', questionId);

    // Update question average time (running average)
    if (timeTakenSec && question.average_time_sec !== undefined) {
      const { count } = await supabaseAdmin
        .from('user_question_history')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);

      const n = count || 1;
      const newAvg = Math.round(
        ((question.average_time_sec * (n - 1)) + timeTakenSec) / n
      );

      const newTopper = (question.topper_time_sec === 0 || timeTakenSec < question.topper_time_sec)
        ? timeTakenSec
        : question.topper_time_sec;

      await supabaseAdmin
        .from('questions')
        .update({ average_time_sec: newAvg, topper_time_sec: newTopper })
        .eq('id', questionId);
    }

    // Fire-and-forget: pre-generate follow-ups if wrong
    if (!isCorrect) {
      getFollowUpQuestions(questionId, question).catch(err =>
        console.error('Background follow-up generation error:', err.message)
      );
    }

    res.json({
      success: true,
      newElo: newUserElo,
      eloDelta: newUserElo - userElo
    });

  } catch (err) {
    console.error('Answer Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/questions/batch
 * Pre-fetch a batch of questions for offline/buffer use
 */
app.get('/api/questions/batch', async (req, res) => {
  const { topic, userId, count = 5, excludeIds } = req.query;
  const excludeList = excludeIds ? excludeIds.split(',') : [];

  try {
    const profile = await getUserProfile(userId || 'anonymous');
    const range = getTargetEloRange(profile.elo_rating);

    // Fetch history to avoid repeats
    const { data: history } = await supabaseAdmin
      .from('user_question_history')
      .select('question_id')
      .eq('user_id', userId || 'anonymous');

    const answeredIds = new Set([...(history || []).map(h => h.question_id), ...excludeList]);

    let query = supabaseAdmin
      .from('questions')
      .select('*')
      .gte('elo_rating', range.min)
      .lte('elo_rating', range.max)
      .limit(50); // Fetch a pool to shuffle

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter unseen and shuffle
    const unseen = (data || []).filter(q => !answeredIds.has(q.id));
    const shuffled = unseen.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(count));

    res.json({ questions: selected, userElo: profile.elo_rating });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vercel serverless export & local dev ────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
}

module.exports = app;
