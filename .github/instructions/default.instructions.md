---
applyTo: '**'
---
# Copilot Instructions for D-Zero

## Project Architecture

This is a **generic TTRPG encounter manager** with a React frontend, featuring real-time collaboration through event sourcing. While currently D&D-focused in implementation, the architecture is designed to be template-driven and support multiple TTRPG systems.

### Key Components

- **Frontend**: React + TypeScript + Vite with Tailwind CSS and Radix UI
- **Backend**: External Rust "Room Host" server (separate closed-source project) providing generic real-time collaboration
- **API Client**: `dnd5eapi/` submodule generates TypeScript client for public D&D 5e API queries only
- **Real-time Sync**: Event sourcing system with WebSocket connections for collaborative room management
- **Database Layer**: Abstract collection system supporting LocalStorage, RAM, and remote collections

## Critical Patterns & Conventions

### Functional Programming Architecture
- **Result/Option types** (`src/lib/Result.ts`, `src/lib/Option.ts`): Use `Result<T, E>` for operations that can fail, `Option<T>` for nullable values
- **AsyncResult/AsyncOption**: Promise-wrapped versions for async operations
- Import `@/lib/OptionResultInterop` to enable `.ok()` and `.okOr()` interop methods

```typescript
// Preferred error handling pattern
const result = await roomHost.room.connect(token)
  .andThen(connection => setupDatabase(connection))
  .orElse(err => handleConnectionError(err));
```

### Event Sourcing System
- **EventSource** (`src/eventSource/EventSource.ts`): Core event sourcing implementation with snapshots
- Events are chronologically ordered and immutable
- State is derived by replaying events from snapshots
- Use `dispatch()` to add events, `insertEvents()` for historical events, `replay()` for state reconstruction

### Room & Collaboration System
- **Rooms** (`src/sync/room/`): Core abstraction for collaborative sessions
- **Local Room**: Created by host, stores data in LocalStorage
- **Remote Room**: Connects to published room via membership token
- **Collections**: Database abstraction (`src/db/`) supporting query reactivity via RxJS

### Testing Strategy
- **Unit tests**: Node environment, `.test.ts` files
- **Browser tests**: Playwright environment, `.test.tsx` and hook tests
- Use Vitest with separate browser/node test configs
- Use Copilot's integrated testing functionality for running and debugging tests
- Factory pattern for test data generation in API client tests

### Utilities & Conventions
- **@trace()/@traceAsync()**: Method-level logging decorators for debugging
- Custom React hooks follow `useCamelCase` pattern, placed in `src/hooks/`
- Prefer functional programming patterns with Result/Option types over exceptions

## Development Workflows

### Key File Locations
- **Routes**: `src/routes.ts` (frontend), `dnd5eapi/src/routes/` (API client)
- **Components**: `src/components/` (custom), `src/components/ui/` (Radix-based)
- **Collections**: `src/db/` (abstractions), `src/db/record/` (schemas)
- **API Types**: `src/generated/dnd5eapi.d.ts` (auto-generated from OpenAPI)

## Integration Points

### D&D 5e API Client
- Generated TypeScript client for public D&D 5e API
- Supports both 2014 and 2024 D&D content via versioned endpoints
- Build system in `dnd5eapi/` submodule generates types only

### Real-time Synchronization
- WebSocket connections to external Rust Room Host server
- Message-based protocol for database operations via `RoomHostConnection`
- Presence tracking for connected users

### State Management
- **React Context**: Room state and actions via context providers
- **RxJS Observables**: Reactive data flows throughout the application
- **Local Persistence**: Collections automatically sync to LocalStorage

## Common Tasks

### Creating New Collection
1. Define record type in `src/db/record/`
2. Register in room database setup (`src/sync/room/Room.ts`)
3. Add to `DndDb` type in `src/sync/room/RoomApi.ts`

### Adding Real-time Features
1. Define message schemas in `src/sync/db/Messages.ts`
2. Handle in `CollectionHost` for server-side logic
3. Use reactive collections in components via `useCollectionQuery`

When implementing features, prioritize type safety and immutability. Follow the established patterns for error handling, state management, and component composition.
