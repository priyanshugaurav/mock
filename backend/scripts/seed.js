require('dotenv').config();
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { generateNvidiaCompletion } = require('../lib/nvidia');
const { QUESTION_GENERATION_PROMPT } = require('../prompts/templates');

const SUBTOPICS = {
  ratio: ['Simplification', 'Division', 'Proportion', 'Word Problems'],
  profit_and_loss: ['Basic CP/SP', 'Percentage Profit', 'Discount/MP', 'Successive Change']
};

/**
 * Seed a single batch of questions using NVIDIA AI
 */
async function seedTopic(topic, subtopic, count = 5) {
  console.log(`\n--- Seeding Topic: ${topic}, Subtopic: ${subtopic} ---`);
  
  for (let i = 0; i < count; i++) {
    // Alternate ELOs to get a mix
    const targetElo = [1000, 1200, 1400, 1600, 1800][i % 5];
    const prompt = QUESTION_GENERATION_PROMPT(topic, subtopic, targetElo);

    try {
      // Use meta/llama-3.1-70b-instruct for high quality math
      const completion = await generateNvidiaCompletion([{ role: 'user', content: prompt }], "meta/llama-3.1-70b-instruct");
      const questionData = JSON.parse(completion);

      // Insert into Supabase
      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert({
          topic: topic,
          subtopic: subtopic,
          question: questionData.question_text || questionData.question,
          options: questionData.options,
          correct_index: questionData.correct_index,
          elo_rating: targetElo,
          latex_steps: questionData.latex_steps,
          explanation: questionData.explanation,
          difficulty: questionData.difficulty,
          tags: questionData.tags,
          ai_generated: true
        });

      if (error) throw error;
      console.log(`✔ Generated question (${targetElo} ELO) for ${subtopic}`);
    } catch (err) {
      console.error(`✖ Error generating question for ${subtopic}:`, err.message);
    }
  }
}

/**
 * Main Runner
 */
async function run() {
  console.log("Starting Seed Process...");

  // Seed Ratio
  for (const sub of SUBTOPICS.ratio) {
    await seedTopic('ratio', sub, 3); // 3 questions per subtopic = 12 total
  }

  // Seed Profit & Loss
  for (const sub of SUBTOPICS.profit_and_loss) {
    await seedTopic('profit_and_loss', sub, 3); // 12 total
  }

  console.log("\nSeed Process Complete!");
}

run();
