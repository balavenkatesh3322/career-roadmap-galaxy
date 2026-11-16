// Learner progress lives only in this browser (localStorage). Every read/write is guarded.
const KEY = 'cg-progress-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage unavailable: keep in memory */ }
}
let cache = load();

function entry(roleId) {
  cache[roleId] ||= { topics: {}, projects: {}, current: 0, cards: {} };
  return cache[roleId];
}
const tkey = (stage, topic) => `${stage}::${topic}`;

export const progress = {
  isTopicDone: (roleId, stage, topic) => !!entry(roleId).topics[tkey(stage, topic)],
  setTopic(roleId, stage, topic, done) { entry(roleId).topics[tkey(stage, topic)] = !!done; save(cache); },
  isProjectDone: (roleId, stage) => !!entry(roleId).projects[stage],
  setProject(roleId, stage, done) { entry(roleId).projects[stage] = !!done; save(cache); },
  current: (roleId) => entry(roleId).current || 0,
  setCurrent(roleId, stage) { entry(roleId).current = stage; save(cache); },
  rateCard(roleId, key, rating) { entry(roleId).cards[key] = { rating, at: Date.now() }; save(cache); },
  cardRating: (roleId, key) => entry(roleId).cards[key]?.rating || null,
  stageDone(role, i) {
    const s = role.stages[i];
    return s.topics.every((t) => this.isTopicDone(role.id, i, t)) && this.isProjectDone(role.id, i);
  },
  counts(role) {
    let done = 0, total = 0;
    role.stages.forEach((s, i) => s.topics.forEach((t) => { total++; if (this.isTopicDone(role.id, i, t)) done++; }));
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  },
  started: () => Object.keys(cache).filter((id) => Object.values(cache[id].topics || {}).some(Boolean))
};
