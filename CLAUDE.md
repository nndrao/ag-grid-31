# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Build**: `npm run build` (TypeScript build + Vite bundle)
- **Dev server**: `npm run dev` (Vite development server)
- **Lint**: `npm run lint` (ESLint)
- **Preview**: `npm run preview` (Preview production build)

## Code Style
- Use TypeScript strict mode with explicit type annotations
- Follow React functional component patterns with hooks
- Use tailwind classes for styling, following ShadCN UI conventions
- Import structure: React/libraries first, then components, then utils/hooks
- Use path aliases: `@/components`, `@/lib`, `@/utils`
- Prefer destructuring for props and state
- Handle loading/error states explicitly in components
- AG Grid customizations should follow established patterns
- Keep components focused on a single responsibility
- Use Grid utility functions from `gridUtils.ts` for AG Grid operations
- Follow established dialog/modal patterns for consistent UX