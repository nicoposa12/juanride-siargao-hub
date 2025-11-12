# JuanRide Command Reference

Complete command reference documentation for developing, deploying, and maintaining the JuanRide vehicle rental marketplace.

---

## 📚 Available Command Guides

### 🗄️ [Database Commands](./database-commands.md)
Complete Supabase and PostgreSQL commands for database management.

**Topics covered:**
- Generating TypeScript types from schema
- Applying migrations
- Seeding test data
- Resetting database
- Backup and restore
- RLS policy management
- Direct SQL queries

**Quick commands:**
```bash
npm run supabase:gen-types    # Generate types from database
# Apply migrations via Supabase Dashboard SQL Editor
# Run seed files via Dashboard
```

---

### ⚡ [Next.js Commands](./nextjs-commands.md)
Development, build, and optimization commands for Next.js 14.

**Topics covered:**
- Development server
- Production builds
- Type checking
- Linting and code quality
- Package management
- Cache management
- Performance analysis

**Quick commands:**
```bash
npm run dev            # Start development server
npm run build          # Production build
npm run type-check     # Validate TypeScript
npm run lint           # Check code quality
```

---

### 🚀 [Build & Deployment](./build-deployment.md)
Production builds, deployment strategies, and hosting platform setup.

**Topics covered:**
- Production build process
- Vercel deployment
- Netlify deployment
- Docker containerization
- VPS/self-hosted setup
- CI/CD pipelines
- Environment configuration
- Rollback procedures

**Quick commands:**
```bash
npm run build          # Create production build
npm run start          # Test production locally
vercel --prod          # Deploy to Vercel
```

---

### 🐛 [Debugging Commands](./debugging-commands.md)
Troubleshooting, debugging techniques, and fixing common issues.

**Topics covered:**
- Browser DevTools usage
- Next.js debugging
- Supabase debugging
- TypeScript debugging
- Network debugging
- Performance profiling
- Common issues and fixes
- Logging best practices

**Quick commands:**
```bash
npm run type-check                    # Find type errors
npm run lint                          # Find code quality issues
rm -rf .next && npm run dev          # Clear cache
npx tsx scripts/debug.ts             # Run debug script
```

---

### 🔧 [Git Commands](./git-commands.md)
Version control, branching strategies, and collaboration workflows.

**Topics covered:**
- Basic Git workflow
- Branch management
- Merging and rebasing
- Resolving conflicts
- Viewing history
- Stashing changes
- Tagging releases
- GitHub workflows

**Quick commands:**
```bash
git status                     # Check current state
git add . && git commit -m     # Stage and commit
git checkout -b feature/name   # Create feature branch
git push -u origin branch      # Push new branch
```

---

## 🎯 Quick Start Guide

### First Time Setup
```bash
# 1. Clone repository
git clone https://github.com/nicoposa12/juanride-siargao-hub.git
cd juanride-siargao-hub

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Generate database types
npm run supabase:gen-types

# 5. Start development server
npm run dev
```

### Daily Development Workflow
```bash
# 1. Pull latest changes
git pull

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Start dev server
npm run dev

# 4. Make changes and test

# 5. Check for errors
npm run type-check
npm run lint

# 6. Commit changes
git add .
git commit -m "feat: your feature description"

# 7. Push to remote
git push -u origin feature/your-feature

# 8. Create Pull Request on GitHub
```

### Before Deployment
```bash
# 1. Run all checks
npm run type-check
npm run lint

# 2. Test production build
npm run build
npm run start

# 3. Generate latest types (if schema changed)
npm run supabase:gen-types

# 4. Deploy
vercel --prod
```

---

## 📖 Common Tasks

### Database Operations

**Update database schema:**
1. Create migration file in `/supabase/database/migrations/`
2. Apply via Supabase Dashboard SQL Editor
3. Run `npm run supabase:gen-types`
4. Restart dev server

**Reset database:**
1. Drop tables via Supabase Dashboard or reset script
2. Re-apply migrations 00001 through 00004
3. Run `npm run supabase:gen-types`
4. Apply seed files

**Add test data:**
1. Create/edit seed file in `/supabase/database/seeds/`
2. Run seed SQL in Supabase Dashboard SQL Editor

### Code Quality

**Fix type errors:**
```bash
npm run type-check            # Find errors
# Fix in code
npm run supabase:gen-types    # If DB related
```

**Fix linting issues:**
```bash
npm run lint                  # Find issues
npm run lint -- --fix         # Auto-fix
```

**Clear caches:**
```bash
rm -rf .next                  # Next.js cache
rm -rf node_modules           # Dependencies
npm install                   # Reinstall
```

### Git Operations

**Create feature branch:**
```bash
git checkout main
git pull
git checkout -b feature/vehicle-search
```

**Update branch with main:**
```bash
git checkout feature-branch
git merge main
# Or: git rebase main
```

**Squash commits:**
```bash
git rebase -i HEAD~3
# Change 'pick' to 'squash' in editor
```

---

## 🛠️ Development Tools

### VS Code Extensions (Recommended)
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **React DevTools** - Component debugging
- **GitLens** - Git history and blame
- **Supabase** - Database management
- **Tailwind CSS IntelliSense** - CSS autocomplete

### Browser Extensions (Recommended)
- **React DevTools** - Component inspection
- **Redux DevTools** - State management (if using Redux)
- **Lighthouse** - Performance auditing

### Command Line Tools
```bash
# TypeScript
npx tsx script.ts              # Run TypeScript file

# Next.js
npx next info                  # Show Next.js info

# Git
git log --graph --oneline      # Visual commit history

# Database
psql [connection-string]       # Direct database access
```

---

## 📝 Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional Variables
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_CHAT=true

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Managing Environment Variables
```bash
# Check if loaded
echo $NEXT_PUBLIC_SUPABASE_URL

# Load from file
source .env.local

# Verify in app
# Navigate to: http://localhost:3000/debug-env
```

---

## 🔍 Troubleshooting Quick Reference

| Problem | Solution | Guide |
|---------|----------|-------|
| Build fails | Clear cache: `rm -rf .next && npm run build` | [Next.js Commands](./nextjs-commands.md) |
| Type errors | Run `npm run supabase:gen-types` | [Database Commands](./database-commands.md) |
| Auth issues | Check session in DevTools Console | [Debugging](./debugging-commands.md) |
| Database query fails | Check RLS policies in Dashboard | [Database Commands](./database-commands.md) |
| Merge conflicts | Resolve in editor, `git add`, `git merge --continue` | [Git Commands](./git-commands.md) |
| Port 3000 in use | Kill process or use `PORT=3001 npm run dev` | [Next.js Commands](./nextjs-commands.md) |
| Env vars not loading | Restart dev server after editing `.env.local` | [Next.js Commands](./nextjs-commands.md) |
| Hydration mismatch | Check for client-only code running on server | [Debugging](./debugging-commands.md) |

---

## 🚨 Emergency Commands

### Critical Bug in Production
```bash
# 1. Create hotfix branch
git checkout main
git checkout -b hotfix/critical-bug

# 2. Fix the bug

# 3. Test locally
npm run build
npm run start

# 4. Deploy immediately
vercel --prod

# 5. Merge back to main
git checkout main
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix: critical bug"
git push --follow-tags
```

### Database Emergency
```bash
# Backup immediately
pg_dump -h db.xxx.supabase.co > emergency_backup.sql

# Check Supabase Dashboard for automated backups
# Restore from Dashboard if needed
```

### Rollback Deployment
```bash
# Vercel
vercel ls                      # List deployments
vercel rollback [url]          # Rollback to specific version

# PM2
pm2 stop app
git checkout [previous-commit]
npm run build
pm2 restart app
```

---

## 📚 Additional Resources

### Documentation
- **Project README:** `/README.md`
- **Setup Guide:** `/docs/guides/SETUP_GUIDE.md`
- **Project Structure:** `/docs/implementation/project-structure.md`
- **Implementation Status:** `/docs/summaries/IMPLEMENTATION_STATUS.md`
- **Supabase Setup:** `/supabase/README.md`

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Git Documentation](https://git-scm.com/doc)
- [React Documentation](https://react.dev)

---

## 💡 Tips and Best Practices

### Performance
- Keep First Load JS under 200 KB
- Use `next/image` for images
- Implement code splitting with dynamic imports
- Cache API responses with TanStack Query

### Security
- Never commit `.env.local` or secrets
- Always use RLS policies in Supabase
- Validate user input on server-side
- Use `supabaseAdmin` only in API routes

### Code Quality
- Run `npm run type-check` before committing
- Use meaningful commit messages
- Keep components small and focused
- Write self-documenting code with good naming

### Database
- Always use migrations for schema changes
- Test queries with EXPLAIN ANALYZE
- Keep RLS policies simple and performant
- Back up before major changes

---

## 🎓 Learning Path

### For New Developers
1. Read [Setup Guide](/docs/guides/SETUP_GUIDE.md)
2. Review [Project Structure](/docs/implementation/project-structure.md)
3. Practice with [Next.js Commands](./nextjs-commands.md)
4. Learn [Git Commands](./git-commands.md)
5. Explore [Database Commands](./database-commands.md)

### For Contributors
1. Read [PRD](/docs/planning/prd.md)
2. Review [Implementation Status](/docs/summaries/IMPLEMENTATION_STATUS.md)
3. Check [Git Commands](./git-commands.md) for workflow
4. Use [Debugging Commands](./debugging-commands.md) when stuck

---

## 📞 Getting Help

### When Stuck
1. Check relevant command guide above
2. Review [Debugging Commands](./debugging-commands.md)
3. Check error logs: `npm run dev` output
4. Inspect browser console (F12)
5. Check Supabase Dashboard logs
6. Search GitHub issues
7. Ask team members

### Reporting Issues
Include in bug reports:
- Error message
- Steps to reproduce
- Expected vs actual behavior
- Environment (dev/production)
- Browser and version
- Screenshots if applicable

---

**Last Updated:** November 2025  
**Maintained By:** JuanRide Development Team  
**Project:** JuanRide Siargao Hub - Vehicle Rental Marketplace
