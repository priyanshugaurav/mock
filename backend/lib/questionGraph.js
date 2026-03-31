const { supabaseAdmin } = require('./supabaseAdmin');
const { generateNvidiaCompletion } = require('./nvidia');
const { QUESTION_GENERATION_PROMPT, WRONG_ANSWER_ANALYSIS_PROMPT } = require('../prompts/templates');

/**
 * Get follow-up questions when a user answers a question wrong.
 * 
 * Strategy:
 * 1. Check if the wrong question already has child edges in the graph.
 * 2. If yes → return those child questions.
 * 3. If no → use AI to analyze the mistake, generate 2-3 easier questions,
 *    store them in DB, create graph edges, and return them.
 */
async function getFollowUpQuestions(parentQuestionId, parentQuestion) {
  // Step 1: Check existing graph edges
  const { data: edges, error: edgeErr } = await supabaseAdmin
    .from('question_edges')
    .select('child_question_id')
    .eq('parent_question_id', parentQuestionId)
    .eq('edge_type', 'wrong_followup');

  if (!edgeErr && edges && edges.length > 0) {
    // Fetch the actual child questions
    const childIds = edges.map(e => e.child_question_id);
    const { data: childQuestions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .in('id', childIds);

    if (childQuestions && childQuestions.length > 0) {
      return childQuestions;
    }
  }

  // Step 2: No existing follow-ups → Generate with AI
  const lowerElo = Math.max(800, (parentQuestion.elo_rating || 1200) - 200);
  const topic = parentQuestion.topic || 'ratio';
  const subtopic = parentQuestion.subtopic || 'General';

  const generatedQuestions = [];

  for (let i = 0; i < 2; i++) {
    const targetElo = lowerElo - (i * 100);
    const prompt = QUESTION_GENERATION_PROMPT(topic, subtopic, targetElo);

    try {
      const raw = await generateNvidiaCompletion(
        [{ role: 'user', content: prompt }],
        'meta/llama-3.1-70b-instruct'
      );

      const parsed = JSON.parse(raw);

      // Insert into DB
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('questions')
        .insert({
          topic,
          subtopic,
          question_text: parsed.question_text,
          options: parsed.options,
          correct_index: parsed.correct_index,
          elo_rating: targetElo,
          latex_steps: parsed.latex_steps || [],
          difficulty: parsed.difficulty || 'easy',
          tags: parsed.tags || [topic],
          ai_generated: true
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Insert error:', insertErr.message);
        continue;
      }

      // Create graph edge: parent → new child
      await supabaseAdmin
        .from('question_edges')
        .insert({
          parent_question_id: parentQuestionId,
          child_question_id: inserted.id,
          edge_type: 'wrong_followup',
          weight: 1.0
        });

      generatedQuestions.push(inserted);
    } catch (err) {
      console.error('AI generation error:', err.message);
    }
  }

  return generatedQuestions;
}

/**
 * Get the next progression question when user answers correctly.
 * Finds a question with slightly higher ELO in the same topic.
 */
async function getProgressionQuestion(currentQuestion) {
  const higherElo = (currentQuestion.elo_rating || 1200) + 150;

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('topic', currentQuestion.topic)
    .gte('elo_rating', currentQuestion.elo_rating + 50)
    .lte('elo_rating', higherElo + 100)
    .limit(5);

  if (error || !data || data.length === 0) return null;

  // Pick random from the filtered set
  return data[Math.floor(Math.random() * data.length)];
}

module.exports = {
  getFollowUpQuestions,
  getProgressionQuestion
};
