const QUESTION_GENERATION_PROMPT = (topic, subtopic, elo) => `
You are an expert math tutor for Indian competitive exams (SSC CGL, Banking).
Generate one high-quality multiple-choice question in JSON format.

Topic: ${topic}
Subtopic: ${subtopic || 'General'}
Target Difficulty (ELO): ${elo}

Rules:
1. Provide 4 distinct options.
2. Include a step-by-step solution using LaTeX.
3. Include an "explanation" field giving a quick expert tip.
4. Set difficulty based on the ELO: 1000=Easy, 1400=Medium, 1800+=Hard.
5. Use clear, concise language.

Return EXACTLY this JSON structure:
{
  "question_text": "text",
  "options": ["opt1", "opt2", "opt3", "opt4"],
  "correct_index": 0,
  "latex_steps": [
    {"label": "Step 1", "math": "\\\\frac{a}{b}", "sub": "explanation"}
  ],
  "explanation": "expert tip",
  "difficulty": "medium",
  "tags": ["topic", "subtopic"]
}
`;

const WRONG_ANSWER_ANALYSIS_PROMPT = (question, userAnswer) => `
A student answered this question WRONGLY.
Question: ${question.question_text}
Correct Answer: ${question.options[question.correct_index]}
Student Answer: ${userAnswer}

Analyze the mistake and suggest 3 subtopics the student should practice next to improve.
Return EXACTLY this JSON structure:
{
  "analysis": "short analysis of the mistake",
  "recommended_subtopics": ["subtopic1", "subtopic2", "subtopic3"]
}
`;

module.exports = {
  QUESTION_GENERATION_PROMPT,
  WRONG_ANSWER_ANALYSIS_PROMPT
};
