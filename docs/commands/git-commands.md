# Git and Version Control Commands

## Overview
Essential Git commands for managing code, branches, commits, and collaboration workflows in JuanRide.

---

## Basic Git Workflow

### Check Status
```bash
# See modified, staged, and untracked files
git status

# Short format
git status -s
```

### View Changes
```bash
# See unstaged changes
git diff

# See staged changes
git diff --staged

# See changes in specific file
git diff src/components/VehicleCard.tsx

# Compare branches
git diff main..feature-branch
```

### Stage Changes
```bash
# Stage specific file
git add src/components/VehicleCard.tsx

# Stage all changes
git add .

# Stage by pattern
git add src/components/**/*.tsx

# Interactive staging (choose hunks)
git add -p
```

### Commit Changes
```bash
# Commit with message
git commit -m "Add vehicle search functionality"

# Commit with detailed message
git commit -m "Add vehicle search functionality" -m "- Implement search filters
- Add pagination
- Update UI components"

# Amend last commit
git commit --amend

# Amend without changing message
git commit --amend --no-edit
```

### Push Changes
```bash
# Push to current branch
git push

# Push new branch
git push -u origin feature-branch

# Force push (use carefully!)
git push --force-with-lease
```

---

## Branch Management

### Create Branch
```bash
# Create and switch to new branch
git checkout -b feature/vehicle-search

# Create branch without switching
git branch feature/vehicle-search

# Create from specific commit
git checkout -b hotfix/bug-fix abc1234
```

### Switch Branches
```bash
# Switch to existing branch
git checkout main

# Switch with git switch (modern)
git switch feature-branch

# Create and switch (modern)
git switch -c new-feature
```

### List Branches
```bash
# List local branches
git branch

# List all branches (including remote)
git branch -a

# List with last commit
git branch -v

# List merged branches
git branch --merged
```

### Delete Branch
```bash
# Delete local branch (safe)
git branch -d feature-branch

# Force delete
git branch -D feature-branch

# Delete remote branch
git push origin --delete feature-branch
```

### Rename Branch
```bash
# Rename current branch
git branch -m new-branch-name

# Rename other branch
git branch -m old-name new-name
```

---

## Synchronizing with Remote

### Fetch Updates
```bash
# Fetch all branches
git fetch

# Fetch specific remote
git fetch origin

# Fetch and prune deleted branches
git fetch --prune
```

### Pull Updates
```bash
# Pull current branch
git pull

# Pull with rebase
git pull --rebase

# Pull specific branch
git pull origin main
```

### Push Updates
```bash
# Push current branch
git push

# Push all branches
git push --all

# Push tags
git push --tags
```

---

## Merging and Rebasing

### Merge Branch
```bash
# Merge feature into current branch
git merge feature-branch

# Merge with no fast-forward
git merge --no-ff feature-branch

# Abort merge
git merge --abort
```

### Rebase
```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (squash, edit commits)
git rebase -i HEAD~3

# Continue after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### Cherry-pick
```bash
# Apply specific commit to current branch
git cherry-pick abc1234

# Cherry-pick multiple commits
git cherry-pick abc1234 def5678

# Cherry-pick without committing
git cherry-pick --no-commit abc1234
```

---

## Viewing History

### View Commit Log
```bash
# Standard log
git log

# One line per commit
git log --oneline

# Graph view
git log --graph --oneline --all

# Show changes in each commit
git log -p

# Show last 5 commits
git log -5

# Filter by author
git log --author="John Doe"

# Filter by date
git log --since="2 weeks ago"
git log --until="2025-01-01"

# Search commit messages
git log --grep="vehicle"
```

### View Specific Commit
```bash
# Show commit details
git show abc1234

# Show files changed
git show --name-only abc1234

# Show stats
git show --stat abc1234
```

### View File History
```bash
# Show commits that changed file
git log -- src/components/VehicleCard.tsx

# Show changes to file over time
git log -p -- src/components/VehicleCard.tsx

# Who changed each line (blame)
git blame src/components/VehicleCard.tsx
```

---

## Undoing Changes

### Unstage Files
```bash
# Unstage specific file
git restore --staged src/components/VehicleCard.tsx

# Unstage all files
git restore --staged .

# Old method (still works)
git reset HEAD src/components/VehicleCard.tsx
```

### Discard Changes
```bash
# Discard changes in specific file
git restore src/components/VehicleCard.tsx

# Discard all changes
git restore .

# Old method
git checkout -- src/components/VehicleCard.tsx
```

### Undo Commits
```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1

# Undo last commit, discard changes (DESTRUCTIVE!)
git reset --hard HEAD~1

# Undo last 3 commits
git reset HEAD~3
```

### Revert Commit
```bash
# Create new commit that undoes changes
git revert abc1234

# Revert without committing
git revert --no-commit abc1234

# Revert merge commit
git revert -m 1 abc1234
```

---

## Stashing

### Save Work
```bash
# Stash current changes
git stash

# Stash with message
git stash save "WIP: vehicle search"

# Stash including untracked files
git stash -u

# Stash including ignored files
git stash -a
```

### Apply Stash
```bash
# Apply most recent stash
git stash apply

# Apply specific stash
git stash apply stash@{2}

# Apply and remove from stash list
git stash pop
```

### Manage Stashes
```bash
# List stashes
git stash list

# Show stash contents
git stash show stash@{0}

# Show detailed diff
git stash show -p stash@{0}

# Delete specific stash
git stash drop stash@{0}

# Delete all stashes
git stash clear
```

---

## Tagging

### Create Tags
```bash
# Lightweight tag
git tag v1.0.0

# Annotated tag (recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Tag specific commit
git tag -a v1.0.0 abc1234 -m "Release 1.0.0"
```

### List Tags
```bash
# List all tags
git tag

# Search for tags
git tag -l "v1.*"

# Show tag details
git show v1.0.0
```

### Push Tags
```bash
# Push specific tag
git push origin v1.0.0

# Push all tags
git push origin --tags
```

### Delete Tags
```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

---

## Collaboration Workflows

### Feature Branch Workflow

1. **Create feature branch**
```bash
git checkout main
git pull
git checkout -b feature/vehicle-search
```

2. **Work on feature**
```bash
# Make changes
git add .
git commit -m "Implement vehicle search"
```

3. **Keep branch updated**
```bash
git checkout main
git pull
git checkout feature/vehicle-search
git merge main
# Or: git rebase main
```

4. **Push and create PR**
```bash
git push -u origin feature/vehicle-search
# Create Pull Request on GitHub
```

5. **After PR merged**
```bash
git checkout main
git pull
git branch -d feature/vehicle-search
```

### Hotfix Workflow

1. **Create hotfix from main**
```bash
git checkout main
git checkout -b hotfix/critical-bug
```

2. **Fix and commit**
```bash
# Fix the bug
git commit -am "Fix critical auth bug"
```

3. **Merge and tag**
```bash
git checkout main
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix: auth bug"
git push --follow-tags
```

---

## Resolving Conflicts

### When Conflict Occurs
```bash
# During merge or rebase
# Git will show:
# CONFLICT (content): Merge conflict in src/components/VehicleCard.tsx
```

### Resolve Conflict
```bash
# 1. Open conflicted file
# Look for conflict markers:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# 2. Edit file to resolve
# Remove markers and keep desired code

# 3. Stage resolved file
git add src/components/VehicleCard.tsx

# 4. Continue merge/rebase
git merge --continue
# Or: git rebase --continue

# 5. Or abort if needed
git merge --abort
# Or: git rebase --abort
```

### Conflict Resolution Tools
```bash
# Use VS Code's built-in conflict resolver
# Or use mergetool
git mergetool

# Accept all theirs
git checkout --theirs src/components/VehicleCard.tsx

# Accept all ours
git checkout --ours src/components/VehicleCard.tsx
```

---

## Advanced Git Commands

### Search Code
```bash
# Search in tracked files
git grep "VehicleCard"

# Search with line numbers
git grep -n "VehicleCard"

# Search in specific commit
git grep "VehicleCard" abc1234
```

### Clean Untracked Files
```bash
# Preview what will be deleted
git clean -n

# Delete untracked files
git clean -f

# Delete untracked files and directories
git clean -fd

# Delete including ignored files
git clean -fdx
```

### Bisect (Find Bug)
```bash
# Start bisect
git bisect start

# Mark current commit as bad
git bisect bad

# Mark known good commit
git bisect good abc1234

# Git will checkout middle commit
# Test and mark as good or bad
git bisect good
# Or: git bisect bad

# Repeat until bug found
# Then reset
git bisect reset
```

### Reflog (Recover Lost Commits)
```bash
# View reflog
git reflog

# Recover lost commit
git checkout abc1234

# Create branch from lost commit
git checkout -b recovered-branch abc1234
```

---

## Git Configuration

### View Configuration
```bash
# View all settings
git config --list

# View specific setting
git config user.name
git config user.email
```

### Set Configuration
```bash
# Global settings (all repos)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Repository-specific
git config user.name "Work Name"
git config user.email "work@email.com"
```

### Useful Configurations
```bash
# Set default editor
git config --global core.editor "code --wait"

# Set default branch name
git config --global init.defaultBranch main

# Enable colors
git config --global color.ui auto

# Set merge strategy
git config --global pull.rebase false

# Set push default
git config --global push.default current

# Aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --graph --oneline --all'
```

---

## GitHub Specific

### Clone Repository
```bash
# Clone via HTTPS
git clone https://github.com/nicoposa12/juanride-siargao-hub.git

# Clone via SSH
git clone git@github.com:nicoposa12/juanride-siargao-hub.git

# Clone specific branch
git clone -b develop https://github.com/nicoposa12/juanride-siargao-hub.git
```

### Remote Management
```bash
# View remotes
git remote -v

# Add remote
git remote add origin https://github.com/user/repo.git

# Change remote URL
git remote set-url origin git@github.com:user/repo.git

# Remove remote
git remote remove origin
```

### Pull Requests
```bash
# Fetch PR branch
git fetch origin pull/123/head:pr-123
git checkout pr-123

# Or use GitHub CLI
gh pr checkout 123
```

---

## Git Best Practices

### Commit Messages
```bash
# ✅ Good commit messages
git commit -m "Add vehicle search filter by type"
git commit -m "Fix: Prevent booking overlap conflicts"
git commit -m "Refactor: Extract booking validation logic"

# ❌ Bad commit messages
git commit -m "fix"
git commit -m "updates"
git commit -m "changes"
```

**Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### Branching Strategy
```bash
# Main branches
main          # Production code
develop       # Integration branch

# Supporting branches
feature/*     # New features
hotfix/*      # Production fixes
release/*     # Release preparation
bugfix/*      # Bug fixes
```

### Before Committing
```bash
# 1. Review changes
git diff

# 2. Check what's staged
git diff --staged

# 3. Run checks
npm run type-check
npm run lint

# 4. Test locally
npm run build

# 5. Commit
git commit -m "Your message"
```

---

## Common Scenarios

### Update Branch with Main
```bash
# Option 1: Merge (preserves history)
git checkout feature-branch
git merge main

# Option 2: Rebase (cleaner history)
git checkout feature-branch
git rebase main
```

### Squash Commits Before Merge
```bash
# Interactive rebase
git rebase -i HEAD~3

# In editor, change 'pick' to 'squash' for commits to combine
# Save and edit combined commit message
```

### Undo Pushed Commit
```bash
# Option 1: Revert (safe, creates new commit)
git revert abc1234
git push

# Option 2: Reset (dangerous, rewrites history)
git reset --hard HEAD~1
git push --force-with-lease
```

### Sync Forked Repository
```bash
# Add upstream remote
git remote add upstream https://github.com/original/repo.git

# Fetch upstream
git fetch upstream

# Merge upstream changes
git checkout main
git merge upstream/main
git push
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Check status | `git status` |
| Stage all | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push` |
| Pull | `git pull` |
| Create branch | `git checkout -b branch-name` |
| Switch branch | `git checkout branch-name` |
| Merge branch | `git merge branch-name` |
| View log | `git log --oneline` |
| Discard changes | `git restore filename` |
| Unstage | `git restore --staged filename` |
| Stash | `git stash` |
| Apply stash | `git stash pop` |

---

## Useful Aliases

Add to `.gitconfig`:
```bash
[alias]
  st = status
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --graph --oneline --all --decorate
  amend = commit --amend --no-edit
  undo = reset --soft HEAD~1
  sync = !git fetch origin && git rebase origin/main
```

Usage:
```bash
git st              # Instead of git status
git co main         # Instead of git checkout main
git visual          # Pretty commit graph
```

---

**Last Updated:** November 2025  
**Current Branch:** `37-add-structured-supabase-folder-architecture-to-nextjs-project`  
**Related Docs:**
- GitHub Flow: https://guides.github.com/introduction/flow/
- Git Book: https://git-scm.com/book/en/v2
