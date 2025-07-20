# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets (favicon, robots.txt)
├── .kiro/                  # Kiro AI assistant configuration
├── .vscode/                # VS Code settings
├── node_modules/           # Dependencies
└── dist/                   # Build output (generated)
```

## Source Code Organization (`src/`)

### Core Application Files
- `main.tsx` - Application entry point
- `App.tsx` - Root component with providers and routing
- `index.css` - Global styles and design system variables
- `vite-env.d.ts` - Vite type definitions

### Directory Structure
```
src/
├── components/             # React components
│   ├── ui/                # shadcn/ui components (auto-generated)
│   └── *.tsx              # Feature-specific components
├── pages/                 # Route-level page components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## Component Organization

### Feature Components (`src/components/`)
Components are organized by feature domain:
- **Driver Management**: `DriverProfile.tsx`, `DriversPage.tsx`
- **Route Management**: `Route*.tsx` components (setup, execution, mounting)
- **Student/Guardian**: `Student*.tsx`, `Guardian*.tsx` components
- **School Management**: `School*.tsx` components
- **Navigation**: `BottomNavigation.tsx`
- **Trip Management**: `ActiveTrip.tsx`

### UI Components (`src/components/ui/`)
- Auto-generated shadcn/ui components
- Consistent with Radix UI patterns
- Styled with Tailwind CSS using design tokens

## Key Architectural Patterns

### Routing Structure
- Single Page Application (SPA) with React Router
- Main route: `/` → `DriverApp` component
- Catch-all: `*` → `NotFound` component

### State Management
- **Server State**: TanStack Query for API data
- **Client State**: React hooks and context
- **Form State**: React Hook Form with Zod validation

### Styling Approach
- **Design System**: CSS variables in `index.css`
- **Component Styling**: Tailwind utility classes
- **Theme Support**: Light/dark mode via CSS variables
- **Mobile-First**: Responsive design with mobile optimizations

### Import Conventions
- Use path aliases: `@/components`, `@/lib`, `@/hooks`
- Absolute imports preferred over relative imports
- UI components imported from `@/components/ui`

## File Naming Conventions
- **Components**: PascalCase (e.g., `DriverProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useDriverData.ts`)
- **Types**: camelCase (e.g., `driver.ts`)
- **Utils**: camelCase (e.g., `utils.ts`)

## Configuration Files
- `vite.config.ts` - Vite configuration with path aliases
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration with relaxed rules
- `eslint.config.js` - ESLint configuration