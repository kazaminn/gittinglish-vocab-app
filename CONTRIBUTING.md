# Contributing

## Principles

- Keep changes small with a clear intent
- Keep `main` always working

---

## Branching

- `main`: always stable (no direct push)
- Working branches: `<type>/<short-description>`

Examples:
- `feat/add-card-share`
- `fix/null-pointer-on-preview`

Branches are expected to be short-lived.

---

## Commit messages

Format:

<emoji> <type>(<scope>): <subject>

Examples:

✨ feat(ui): add font preset selector  
🛠️ fix(api): handle empty prompt safely  
🧹 chore(ci): bump node to 20  

### Language

- Both the subject (first line) and the body must be written in **English**
- This repo is a public OSS project; readability for external contributors comes first

### Types (with emoji)

- 🎉 init       - initial setup
- ✨ feat       - new feature
- 🛠️ fix        - bug fix
- ♻️ refactor   - refactor with no behavior change
- 🚀 perf       - performance improvement
- 🧪 test       - tests added or updated
- 💄 style      - formatting only
- 📝 docs       - documentation
- 🧹 chore      - config, deps, tooling
- 🚧 wip        - work in progress

### Commit granularity

- One commit = one intent
- Keep formatting-only changes in their own commit
- WIP commits are allowed (clean them up later)

---

## Pull requests

- CI must be green
- Split large diffs (rough guideline: ±300 lines)
- Title and description must both be written in **English** (same policy as commit messages)
