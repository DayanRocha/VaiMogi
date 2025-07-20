# Design Document

## Overview

The Driver Routes Management feature extends the existing driver section with a comprehensive routes list interface. This feature integrates seamlessly with the current React-based architecture, utilizing the existing navigation patterns, UI components, and state management approaches. The design follows the established mobile-first approach and maintains consistency with the current orange-themed design system.

## Architecture

### Component Hierarchy

```
DriversPage (existing)
└── routes-list tab navigation
    └── DriverRoutesListPage (new)
        ├── RouteRegistrationDialog (new)
        ├── ActiveRoutesSection (new)
        └── RouteHistorySection (new)
```

### Integration Points

- **Navigation**: Integrates with existing `DriversPage` component through the `routes-list` tab
- **State Management**: Utilizes existing `useDriverData` hook for route data persistence
- **UI Components**: Leverages shadcn/ui components (Dialog, Card, Button, Input, Checkbox)
- **Routing**: Follows existing navigation stack pattern in `DriverApp.tsx`

## Components and Interfaces

### 1. DriverRoutesListPage Component

**Purpose**: Main container component that displays the three route management options

**Props Interface**:
```typescript
interface DriverRoutesListPageProps {
  onBack: () => void;
  routes: Route[];
  onCreateRoute: (routeData: RouteFormData) => void;
  onUpdateRoute: (id: string, routeData: RouteFormData) => void;
}
```

**Key Features**:
- Orange gradient header matching existing design patterns
- Three main action cards: "Cadastrar rota", "Rotas em execução", "Histórico de rotas"
- Mobile-optimized touch targets and spacing
- Consistent with existing `DriversPage` visual design

### 2. RouteRegistrationDialog Component

**Purpose**: Modal dialog for creating and editing routes

**Props Interface**:
```typescript
interface RouteRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (routeData: RouteFormData) => void;
  editingRoute?: Route | null;
}

interface RouteFormData {
  name: string;
  time: string;
  daysOfWeek: DayOfWeek[];
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
```

**Key Features**:
- Form validation using existing patterns
- Time picker input (HTML5 time input)
- Individual day checkboxes with visual feedback
- Quick selection buttons: "Semana toda" and "Dias úteis"
- Mobile-responsive dialog layout
- Save/Cancel actions with proper state management

### 3. ActiveRoutesSection Component

**Purpose**: Displays currently executing routes

**Props Interface**:
```typescript
interface ActiveRoutesSectionProps {
  routes: Route[];
  onRouteAction: (routeId: string, action: 'pause' | 'resume' | 'stop') => void;
}
```

**Key Features**:
- Real-time status indicators
- Route progress visualization
- Action buttons for route control
- Empty state handling

### 4. RouteHistorySection Component

**Purpose**: Displays completed route history

**Props Interface**:
```typescript
interface RouteHistorySectionProps {
  routes: Route[];
  onViewDetails: (routeId: string) => void;
}
```

**Key Features**:
- Chronological listing (newest first)
- Route completion details
- Search/filter capabilities
- Pagination for large datasets

## Data Models

### Extended Route Interface

```typescript
interface Route {
  id: string;
  name: string;
  time: string; // HH:MM format
  daysOfWeek: DayOfWeek[];
  status: 'scheduled' | 'active' | 'completed' | 'paused';
  createdAt: Date;
  lastExecuted?: Date;
  completedAt?: Date;
  driverId: string;
  students: string[]; // Student IDs
  schools: string[]; // School IDs
}
```

### Form State Management

```typescript
interface RouteFormState {
  name: string;
  time: string;
  selectedDays: Set<DayOfWeek>;
  errors: {
    name?: string;
    time?: string;
    days?: string;
  };
}
```

## Error Handling

### Validation Rules

1. **Route Name**: Required, minimum 3 characters, maximum 50 characters
2. **Route Time**: Required, valid HH:MM format
3. **Days of Week**: At least one day must be selected

### Error Display Strategy

- Inline field validation with red text and icons
- Form-level error summary for multiple issues
- Toast notifications for save/update operations
- Network error handling with retry mechanisms

### Error Recovery

- Auto-save draft functionality for form data
- Graceful degradation for offline scenarios
- Validation state persistence during navigation

## Testing Strategy

### Unit Testing

**Components to Test**:
- `RouteRegistrationDialog` form validation logic
- Day selection utility functions
- Route data transformation functions

**Test Cases**:
- Form validation with various input combinations
- Quick selection button functionality ("Semana toda", "Dias úteis")
- Error state handling and display
- Save/cancel operations

### Integration Testing

**Scenarios**:
- Navigation flow from DriversPage to routes list
- Route creation and persistence through useDriverData hook
- Dialog open/close state management
- Route list filtering and display

### Mobile Testing

**Focus Areas**:
- Touch target accessibility (minimum 44px)
- Dialog responsiveness on small screens
- Form input behavior on mobile keyboards
- Gesture navigation compatibility

### Accessibility Testing

**Requirements**:
- Screen reader compatibility
- Keyboard navigation support
- Color contrast compliance
- Focus management in dialogs

## Implementation Notes

### State Management Integration

The feature integrates with the existing `useDriverData` hook pattern:

```typescript
// In DriverApp.tsx
const {
  routes,
  addRoute,
  updateRoute,
  deleteRoute
} = useDriverData();
```

### Navigation Integration

Follows the existing navigation stack pattern:

```typescript
// Navigation handling
case 'routes-list':
  return (
    <DriverRoutesListPage
      routes={routes}
      onBack={handleBackNavigation}
      onCreateRoute={addRoute}
      onUpdateRoute={updateRoute}
    />
  );
```

### Styling Approach

- Maintains consistency with existing orange gradient theme
- Uses Tailwind CSS utility classes following project patterns
- Leverages existing CSS variables for theming
- Mobile-first responsive design principles

### Performance Considerations

- Lazy loading for route history with large datasets
- Debounced search functionality
- Optimistic UI updates for better perceived performance
- Efficient re-rendering with proper React keys and memoization