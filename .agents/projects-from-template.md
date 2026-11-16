# Projects created from this template

This template keeps its full commit history. A project created from it does **not**: it starts
from one snapshot commit and never imports the template's commits, neither when it is created nor
when it later takes template updates.

Why: a project's history must show only the project's own work. Template commits in it make `git
log`, blame and reviews noisy, and every template change would look like project work.

## Create a project

```bash
# 1. Empty repo for the project (GitHub example)
gh repo create <owner>/<project> --private

# 2. Clone the template, then replace its history with one snapshot commit
git clone -o template <template-url> <project> && cd <project>
git switch -c main
git reset --soft "$(git commit-tree HEAD^{tree} -m 'chore: initial commit from <template>' \
  -m "Snapshot of <template> at $(git rev-parse --short HEAD).")"

# 3. Record which template commit the project started from, and commit it
node scripts/template-sync.js init --template <template> --remote template \
  --branch <template-branch> --sha "$(git rev-parse template/<template-branch>)"
git add .template-sync && git commit -m "chore: record template sync point"

# 4. Publish
git remote add origin <project-url> && git push -u origin main
```

`.template-sync` is committed in the project; it is the only link to the template.

## Take template updates

```bash
node scripts/template-sync.js          # or: --to <template commit>
git diff --cached                      # review; fix conflict markers if reported
git commit -m "chore: sync <template> <old>..<new>"
```

The script fetches the template, takes only `git diff <recorded sha> <new sha>`, applies it to the
working tree with a three-way merge (project edits are kept; real overlaps become conflict
markers), stages it and moves `.template-sync` to the new commit. The project gets **one** commit
per sync and no template commit.

Never `git merge`, `git pull` or `git cherry-pick` from the template remote in a project: each of
them imports template commits.

## Rules

- The template itself keeps its history: never squash or rewrite the template repo.
- A project never merges, pulls or cherry-picks from the template remote; it only runs
  `scripts/template-sync.js`.
- One sync = one commit (`chore: sync <template> <old>..<new>`), with `.template-sync` updated in
  the same commit.
- If `.template-sync` is missing (a project created before this rule), create it once with
  `init --sha <the template commit the project last matched>`; when unsure, pick the template
  commit closest to the project's snapshot and review the first sync carefully.
