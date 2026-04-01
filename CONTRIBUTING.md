# Contributing to PetBuddyCentral Store Keeper

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/PetBuddyCentral-StoreKeeper.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Follow the [setup instructions](README.md#getting-started) to get the project running locally.

## 📝 Development Workflow

### Branch Naming

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation updates |
| `refactor/` | Code refactoring |

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add barcode scanning to POS
fix: correct GST calculation for exempt items
docs: update API documentation
refactor: extract invoice generation logic
```

### Pull Requests

1. Ensure your code passes `npm run lint`
2. Update documentation if needed
3. Add descriptive PR title and description
4. Reference related issues if applicable

## 🏗️ Project Conventions

### Code Style
- **TypeScript** for all source files
- **ESLint** for code linting (`npm run lint`)
- Use functional components with React hooks
- Use server components where possible (Next.js App Router)

### Database
- **Prisma** for all database operations
- Run `npm run db:push` after schema changes
- Update `seed.ts` for new seed data

### File Organization
- Pages go in `app/app/<route>/page.tsx`
- Shared utilities go in `app/lib/`
- API routes go in `app/app/api/`

## 🔒 Security

- Never commit `.env` files or secrets
- Use environment variables for all sensitive configuration
- Report security vulnerabilities privately

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.
