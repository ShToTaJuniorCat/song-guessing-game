# Frontend Style Guide (React + TypeScript)

A companion to the general code style guide and the FastAPI guide. The general guide applies here unless this document says otherwise.

## Stack

- React and TypeScript only.
- Vite for building and dev server.
- MUI for UI components.
- npm is the only package manager.

## Tooling

### Never hand-edit what a CLI can generate

If an existing tool can create or modify something, use the tool instead of writing it yourself. This matters most when creating the project.

- Scaffold with Vite: `npm create vite@latest <project-name> -- --template react-ts`
- Add dependencies with `npm install <package>`, never by editing `package.json` by hand.
- Prefer a package's own init/generator command over copying configuration from docs.

### Package management

- npm only. No yarn or pnpm.
- The lockfile (`package-lock.json`) is always committed, unless there is a real reason not to (credentials, personal information). Those should never end up in it in the first place if the rule above is followed.

### Linting and formatting

- ESLint and Prettier are mandatory.
- `any` is banned.

### Dependencies

- Prefer a trusted library over hand-written code.
- A baseline set of libraries is defined for common needs (see "Still to decide"), but the guide does not go deeper than that.
- Using any package outside the baseline requires consulting first.

## No plain HTML

- No plain HTML elements anywhere in the code: no `<div>`, `<span>`, `<p>`, and so on.
- Every component is either a MUI component or a custom component.
- A custom component is composed only of MUI components or other custom components.
- If MUI has no suitable component, look for one in another package before building one.
- The only exceptions are places where plain HTML is strictly required (for example the root `index.html`). If it is not strictly required, use MUI.
- Where an ESLint rule can enforce this, use it.

## Components

- Function components, written as `function` declarations.
- Default exports are allowed.
- **One component per file.**
- The file structure mirrors the UI structure.

### Props

- Props are declared as an `interface` placed directly above the component.
- The interface is named exactly `<ComponentName>Props`. For `SomeCustomTable`, it is `SomeCustomTableProps`.
- The props interface lives in the same file as its component.
- The "about 5 or more is a smell" rule for function parameters applies to props too. Group related props into an object.

### Supporting files

`hooks.ts`, `types.ts` and `consts.ts` need a justification to exist. A file earns its place when either:

- it would hold more than about 3 elements (hooks, types or constants), or
- one of its elements is used by multiple files in the module.

A component's props are the exception. They stay with the component, not in `types.ts`.

### Event handlers

Small inline event handlers are fine, as long as they are small and easy to read.

## State and effects

- Use `useState`, TanStack Query and `useContext` where each is useful.
- Avoid `useRef`. There is almost always a better way.
- Prefer libraries over hand-written logic.
- `useEffect` is allowed when it is beneficial.

## Talking to the backend

- API types are generated from the backend's OpenAPI schema with openapi-typescript. They are never written by hand.

## Errors

- Show errors with snackbars.
- Use error pages where they make sense.

## Still to decide

- Component size and splitting rules.
- The baseline list of "obvious" packages.
- Exact boundaries of the no-HTML rule (see open questions in the conversation).
- Where single-use hooks and constants live.
- Conventions for TypeScript, MUI styling and theming, routing, forms, testing, imports and CI.
