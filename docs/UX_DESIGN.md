# Career Galaxy — UX Design

> **Approved design: v3 (2026-11-16).** The screens in [`docs/design/`](design/) are the source of truth
> (light and dark PNGs, plus editable sources in `docs/design/source/`). This document keeps the
> original goals, personas, flows and accessibility rules, which still apply. The early wireframes
> below show v1 layouts. The app is built with PixiJS + PixiJS 3D.

> A 3D interactive atlas of tech careers. Every field is a planet. Every roadmap is a climb.

## 1. Problem & goals

People asking "how do I become a Data Scientist / DevOps engineer / Gen AI engineer?" get flat
lists of 200 boxes and no sense of **where they are**, **what overlaps** with what they
already know, or **what to do today**.

| Goal | How we measure it |
|---|---|
| See the whole landscape of tech roles in < 10 seconds | First screen = galaxy of all roles grouped by domain |
| Pick a path with confidence | Each role shows summary, duration, prerequisites, "what you do" |
| Know the next concrete step | Every stage has a goal, topics, resources and a build project |
| Feel progress | Checkboxes → glowing nodes, progress rings on planets |
| Reuse what you know when switching | "I already am…" pivot mode highlights shared topics |
| Grow with the industry | New field = one JSON file; validator + issue template |

## 2. Personas

1. **Explorer (student / career changer)** — doesn't know the names of roles yet. Needs the
   map, plain-language summaries and "what you do day to day".
2. **Climber (committed learner)** — picked a role, comes back weekly. Needs progress saved,
   next step obvious, resources and projects.
3. **Pivoter (working engineer)** — e.g. backend dev → ML engineer. Needs overlap: what can be
   skipped, what's new.
4. **Contributor (practitioner)** — wants to fix or add a roadmap in minutes without learning
   the codebase.

## 3. Information architecture

```
Galaxy (all domains)
 └─ Domain cluster  (Software · Data · AI/ML · Infrastructure · Security · Product & Design · Frontier)
     └─ Role planet  (e.g. "Gen AI Engineer")
         └─ Roadmap = spiral path of Stages (6–8)
             └─ Stage = goal + Topics (checklist) + Resources + Build project + Self-check
```

Data lives in `roadmaps/<role-id>.json`; `roadmaps/index.json` lists domains and roles.

## 4. Core flows

**A. Explore → choose**
1. Land on the galaxy, slow auto-rotate, domain labels float above clusters.
2. Hover a planet → it grows, its *shared-skill links* to other roles light up, tooltip shows
   title + one-line summary.
3. Click → camera flies in (1.2 s ease) → role card opens.

**B. Climb a roadmap**
1. Roadmap view: stages are crystals on a rising spiral (the climb). Topics orbit each crystal.
2. Click a stage (or press → / ←) → camera glides along the spiral to it; panel shows details.
3. Tick topics → satellites turn green; tick project → crystal turns gold. Progress ring updates
   on the planet back in the galaxy.
4. "Guided tour" auto-flies stage by stage with narration-style captions (teaching mode).

**C. Pivot**
1. In the top bar: "I already am: [role ▾]".
2. In any roadmap, topics that appear in your current role are tagged **known** and pre-dimmed;
   the panel shows "~N% overlap — start at Stage X".

**D. Self-check (active recall)**
1. On any stage, "Self-check" opens flashcards built from that stage's topics:
   "Explain *Vector databases* to a teammate in 2 sentences".
2. User rates Again / Good / Easy. "Easy" ticks the topic.

**E. Contribute**
1. "＋ Suggest a field" in the galaxy → opens the GitHub issue template / CONTRIBUTING.
2. Contributor runs `npm run new -- <id> "<Title>" <domain>` → edits JSON → `npm run validate`.

## 5. Screens (wireframes)

### 5.1 Galaxy
```
┌──────────────────────────────────────────────────────────────────────┐
│ ✦ Career Galaxy   [ 🔍 Search roles…  ⌘K ]   I already am: [none ▾]  │
├────────────┬─────────────────────────────────────────────────────────┤
│ DOMAINS    │                 · AI / ML ·                             │
│ ● All      │            ◯ GenAI   ◯ Agents                           │
│ ● Software │        ◯ MLE ─────── ◯ MLOps         · Infrastructure · │
│ ● Data     │                         ╲             ◯ DevOps  ◯ SRE   │
│ ● AI/ML    │   · Data ·               ╲──────────── ◯ Cloud          │
│ ● Infra    │  ◯ Analyst ◯ DS ◯ DE                                    │
│ ● Security │                      ✦ (stars)        · Security ·      │
│ ● Product  │   · Software ·                         ◯ SOC  ◯ Pentest │
│ ● Frontier │  ◯ FE ◯ BE ◯ FS ◯ Mobile                                │
│ ────────── │                                                         │
│ ROLES (37) │                                     [ ＋ Suggest field ]│
│ list…      │  drag = orbit · scroll = zoom · click planet = open     │
└────────────┴─────────────────────────────────────────────────────────┘
```
The left list is the accessible 2D twin of the 3D scene (keyboard + screen readers + mobile).

### 5.2 Roadmap (climb)
```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Galaxy   Gen AI Engineer  ▓▓▓▓░░░░ 38%     [▶ Guided tour] [List]  │
├──────────────────────────────────────────────┬───────────────────────┤
│                         ◆ 6 Production       │ STAGE 3 · 4–6 weeks   │
│                     ╱                        │ RAG & Retrieval       │
│                ◆ 5 Agents                    │ Goal: ground LLMs in  │
│              ╱                               │ your own data.        │
│         ◆ 4 Fine-tuning     ∘ ∘              │ ☑ Embeddings          │
│        ╱                 ∘  ◆ 3 RAG ∘  ◀ focus│ ☐ Vector databases    │
│   ◆ 2 LLM APIs             ∘ ∘               │ ☐ Chunking strategies │
│  ╱                                           │ RESOURCES ↗           │
│ ◆ 1 Foundations                              │ BUILD: Chat with PDFs │
│                                              │ ☐ Project done        │
│ ‹ prev  ● ● ◉ ○ ○ ○  next ›                  │ [Self-check]          │
└──────────────────────────────────────────────┴───────────────────────┘
```
Mobile (< 760 px): panel becomes a bottom sheet (40 % height, drag/tap to expand); list
button replaces the left sidebar.

## 6. Visual language

- **Space theme**: near-black navy `#05060f`, starfield, soft bloom-like glow via emissive
  materials and additive halos (no heavy post-processing → runs on laptops).
- **Domain colors** (also used in 2D list chips):
  Software `#4f9dff` · Data `#2ed3b7` · AI/ML `#b07cff` · Infrastructure `#ff9f43` ·
  Security `#ff5c7a` · Product & Design `#ffd166` · Frontier `#7cf5ff`.
- **States**: not started = domain color 40 %; in progress = full color + pulsing; topic done
  = green `#3ddc84`; stage done = gold `#ffcc4d`; known-from-pivot = outlined grey.
- **Type**: Inter / system UI; labels are DOM (crisp at any zoom, selectable, translatable).
- **Motion**: camera eases (cubic in-out, 0.9–1.4 s); idle auto-rotate 0.15 rad/s; every
  motion respects `prefers-reduced-motion` (cuts instead of flights, no auto-rotate).

## 7. Interaction model

| Input | Galaxy | Roadmap |
|---|---|---|
| Drag / touch-drag | orbit | orbit |
| Wheel / pinch | zoom | zoom |
| Hover | highlight + links + tooltip | highlight stage |
| Click | open role | focus stage |
| `/` or `⌘K` | search | search |
| `←` `→` | — | previous / next stage |
| `Esc` | close panel | back to galaxy |
| `T` | — | guided tour on/off |

## 8. Accessibility

- 2D list mirrors every 3D object; all labels are real `<button>`s.
- Keyboard-complete, visible focus rings, ARIA live region announces focus changes.
- Colour is never the only signal: ticks, "✓ done" text, progress numbers.
- Reduced motion honoured; WebGL failure falls back to list mode automatically.

## 9. Teaching in 3D (why 3D, not decoration)

1. **Spatial memory** — learners remember "RAG is the third crystal up the spiral" better than
   row 47 of a list (method of loci).
2. **Altitude = progress** — the spiral climbs; finished stages glow beneath you.
3. **Orbiting topics = chunking** — 5–9 satellites per stage keeps each stage within working
   memory.
4. **Links = transfer** — shared-skill beams show what carries over between careers.
5. **Learn → Build → Recall loop** per stage: topics checklist → build project → self-check
   flashcards. See [TEACHING_PLAN.md](TEACHING_PLAN.md).

## 10. Out of scope for v1 (backlog)

Accounts & sync · community ratings of resources · AI tutor per stage · certificates ·
multiplayer "study rooms" · VR mode (WebXR) · localisation.
