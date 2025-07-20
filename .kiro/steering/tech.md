# Technology Stack

## Core Framework & Build System
- **Vite** - Fast build tool and dev server
- **React 18** with TypeScript
- **React Router DOM** for client-side routing
- **SWC** for fast compilation via @vitejs/plugin-react-swc

## UI & Styling
- **shadcn/ui** - Component library built on Radix UI primitives
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Radix UI** - Headless, accessible UI primitives
- **Lucide React** - Icon library
- **CSS Variables** - HSL color system for theming (light/dark mode support)

## State Management & Data
- **TanStack Query (React Query)** - Server state management and caching
- **React Hook Form** - Form handling with Zod validation
- **Zod** - TypeScript-first schema validation

## Development Tools
- **TypeScript** - Type safety with relaxed config (noImplicitAny: false)
- **ESLint** - Code linting with React hooks and TypeScript rules
- **PostCSS** with Autoprefixer

## Key Libraries
- **date-fns** - Date manipulation
- **clsx** + **tailwind-merge** - Conditional CSS classes
- **cmdk** - Command palette component
- **Sonner** - Toast notifications
- **next-themes** - Theme switching

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Package Management
- Uses **npm** as primary package manager
- **Bun** lockfile present (bun.lockb) - alternative runtime supported

## Path Aliases
- `@/*` maps to `./src/*` for clean imports
- Components: `@/components`
- Utils: `@/lib/utils`
- UI Components: `@/components/ui`
- Hooks: `@/hooks`