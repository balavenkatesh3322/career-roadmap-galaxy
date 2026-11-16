# Contributing to Career Galaxy

Thanks for helping people find their path. Most contributions are **content**: fixing a roadmap, adding resources, or adding a new career. You don't need to touch the 3D code.

## Add a new career

1. Open a [New field issue](../../issues/new?template=new-field.yml) with the role, what the job involves, and at least 3 job postings as evidence.
2. Scaffold it:
   ```bash
   npm run new -- <id> "<Title>" <domain> [--emerging]
   # domains: ai, data, software, infra, security, product, frontier
   ```
   This creates `roadmaps/<id>.json` and adds the role to `roadmaps/index.json`.
3. Replace every `TODO`. Then check your work with `npm run validate` and `npm run check-links`.
4. Run `npm run dev`. Your career appears as a moon on its domain planet.
5. Open a pull request. CI runs the same checks.

## Roadmap schema

```jsonc
{
  "id": "context-engineer",            // kebab-case; must match the file name
  "title": "Context Engineer",
  "domain": "ai",                       // one of index.json "domains"
  "status": "emerging",                 // "stable" | "emerging"
  "summary": "One sentence on what they do.",
  "duration": "6–9 months",            // at roughly 10 hours a week
  "whatYouDo": ["…", "…", "…"],
  "skills": ["Python", "LLMs"],        // must exist in index.json "skills" (used by Skill match & Pivot)
  "next": ["ai-agent-engineer"],       // careers this can lead to
  "updated": "2026-11-16",
  "stages": [                           // 4–9 stages; aim for 6
    {
      "title": "Foundations",
      "duration": "3–4 weeks",
      "goal": "What you can do after this stage.",
      "topics": ["Python", "Tokens & context windows"],   // 3–10, short names
      "resources": [{ "title": "Docs name", "url": "https://…" }],
      "project": "A small project that proves the stage."
    }
  ]
}
```

## Style guide

- **The six-stage arc:** Foundations → Core craft → Applied → Scale & quality → Specialise → Professional.
- **Reuse names.** Use the same topic and skill names other careers use (for example "Docker", not "docker containers"). Shared names are what link careers in the galaxy, power Pivot and power Skill match. To add a new skill, add it to `skills` in `index.json`.
- **Free resources first.** Prefer official docs. Use links that will still work in a year.
- **Plain language.** Short topics, and goals that start with a verb.
- **Keep it fresh.** Emerging roles are reviewed every 3 months and stable roles every 12, and the validator warns when one is overdue. Update `updated` when you review.

## Library (community roadmaps)

The library is built from [awesome-roadmaps](https://github.com/liuchong/awesome-roadmaps) by the scripts in `scripts/library/`:

```bash
python3 -I scripts/library/pull_library.py README.md libdata      # download READMEs + licences
python3 -I scripts/library/reparse_library.py libdata             # parse into stages/topics
python3 -I scripts/library/compact.py libdata src/data/library-content.json
```

Only repos with an open licence keep their content, always with credit. Repos without a licence, and articles, show our own roadmap for the same career.

## Code

- `src/scene/space.js` holds the shared PixiJS 3D setup: transparent `View3D`, glossy materials, and DOM labels pinned to 3D nodes.
- Keep every 3D action available as a real `<button>` (labels, panels and lists) so keyboard and screen-reader users aren't left out.
- Respect `prefers-reduced-motion`.

## Community

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately; see [SECURITY.md](SECURITY.md).
