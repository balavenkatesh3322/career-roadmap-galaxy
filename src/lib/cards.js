// Self-check flashcards generated from a stage's topics (active recall). No answers are invented:
// the "hint" points the learner back to the stage's own resources.
const PROMPTS = [
  (t) => `Explain ${t} to a friend in two sentences.`,
  (t) => `When would you use ${t}, and when would you not?`,
  (t) => `What is one common mistake people make with ${t}?`,
  (t) => `Sketch how ${t} fits into a real project you know.`
];

export function cardsFor(role, stageIndex) {
  const st = role.stages[stageIndex];
  return st.topics.map((topic, i) => ({
    key: `${stageIndex}::${topic}`,
    topic,
    q: PROMPTS[i % PROMPTS.length](topic),
    hint: st.resources?.length
      ? `Check your answer against: ${st.resources.map((r) => r.title).join(' · ')}.`
      : `Check your answer against your notes for “${st.title}”, then build: ${st.project}.`
  }));
}
