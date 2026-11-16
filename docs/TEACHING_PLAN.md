# Teaching Plan & Product Roadmap

## 1. The field catalogue (v1 — 39 roles, 7 domains)

| Domain | Roles |
|---|---|
| **Software Engineering** | Frontend · Backend · Full Stack · Mobile · Game Developer · Embedded & IoT · QA / SDET · Software Architect |
| **Data** | Data Analyst · BI Analyst · Data Engineer · Data Scientist · Database Engineer |
| **AI / ML** | ML Engineer · MLOps Engineer · Gen AI Engineer · AI Agent Engineer · AI Research Scientist · Computer Vision Engineer · NLP Engineer · AI Red Teaming & Safety |
| **Infrastructure** | DevOps · Site Reliability Engineer · Cloud Engineer · Platform Engineer · Network Engineer |
| **Security** | Cybersecurity (SOC) Analyst · Penetration Tester · DevSecOps / Cloud Security |
| **Product & Design** | UX / UI Designer · Product Manager · Engineering Manager · Technical Writer · Developer Relations |
| **Frontier** | Blockchain / Web3 · AR / VR (XR) · Quantum Computing · Robotics · Forward Deployed Engineer |

Roles marked `"status": "emerging"` (AI Agent Engineer, AI Red Teaming, Forward Deployed
Engineer, Quantum) get a badge — titles are still settling in industry, so their roadmaps are
reviewed more often.

## 2. How every roadmap is shaped

Each roadmap has **6–8 stages**, always moving through the same arc so learners can switch
fields without relearning the format:

1. **Foundations** — language, tools, mental models.
2. **Core craft** — the 2–3 skills that define the role.
3. **Applied** — real data / real users / real infra.
4. **Scale & quality** — testing, performance, reliability, security.
5. **Specialise** — pick a sub-track.
6. **Professional** — portfolio, system design, interviews, community.

Every stage contains:

| Field | Purpose | Teaching principle |
|---|---|---|
| `goal` | one sentence: what you can do after | outcome-based learning |
| `topics` (5–9) | checklist, orbit the stage crystal | chunking / working memory |
| `resources` (1–3, free first) | where to learn | curated, not exhaustive |
| `project` | build something that proves it | learning by doing |
| `duration` | realistic time at ~10 h/week | expectation setting |
| self-check | generated flashcards from topics | active recall + spacing |

## 3. The learning loop in the app

```
   ┌─────────► LEARN  (tick topics, open resources)
   │              │
 RECALL ◄──── BUILD (stage project → crystal turns gold)
 (self-check      │
  flashcards)     ▼
   └──────── CLIMB to next stage (camera rises up the spiral)
```

- **Guided tour** — first visit to a roadmap auto-flies through all stages with captions
  ("Stage 3: RAG — ground models in your own data. ~5 weeks.") so the learner sees the whole
  climb before starting.
- **Pivot mode** — choose your current role; overlapping topics are marked *known*, and the
  app suggests the first stage with < 50 % overlap as your starting point.
- **Progress** — stored locally (no account). Planets in the galaxy show progress rings so the
  galaxy becomes a personal map.

## 4. Product roadmap

| Phase | Scope | Status |
|---|---|---|
| **v1 — Atlas** | Galaxy, 37 roadmaps, climb view, progress, pivot, self-check, guided tour, list mode, contributor tooling | ✅ this release |
| **v1.1 — Content depth** | Sub-tracks per stage (e.g. Frontend → React / Vue / Svelte), more resources, quizzes in JSON (`stage.quiz`) | next |
| **v1.2 — Share** | Export/import progress JSON, shareable URL `#/role/stage`, printable PDF of a roadmap | |
| **v2 — Tutor** | Optional AI tutor per stage (explain topic, review project repo, generate quizzes) | |
| **v2.1 — Community** | Resource voting, "people who did X went to Y" transitions, localisation | |
| **v3 — Immersive** | WebXR mode, study rooms | |

## 5. Keeping it alive — adding a new field

When a new role appears (as "AI Agent Engineer" and "Forward Deployed Engineer" did):

1. Open an issue with the **New field** template (role, what they do, 3+ job postings as evidence).
2. `npm run new -- context-engineer "Context Engineer" ai` scaffolds `roadmaps/context-engineer.json`
   using the 6-stage arc and registers it in `roadmaps/index.json`.
3. Fill stages; reuse topic names already used by other roles (e.g. "Python", "Docker",
   "Embeddings") — the galaxy auto-draws shared-skill links from matching topic names.
4. `npm run validate` checks schema, ids, URLs format and links in `next`.
5. Open a PR; CI runs the validator.

Review cadence: `emerging` roadmaps every 3 months, `stable` every 12 months (`updated` field).
