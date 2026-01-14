# LDP-V1: Developer Skills & Specifications

This document provides the technical context and visual language specifications for LDP-V1. It is intended to guide LLMs and developers when building new modules to ensure consistency and efficiency.

## Technical Stack
- **Frontend**: Vite + React + TypeScript.
- **Backend**: FastAPI (Python 3.11+).
- **Styling**: Tailwind CSS v4 (using CSS-native `@theme` block).
- **AI Integration**: Google Gemini API (model: `gemini-3-flash-preview`).
- **Data Export**: XLSX (Excel) and PDF.

## Visual Language & Design System
To maintain consistency, all new tools must adhere to the defined tokens in `frontend/src/index.css`.

### Core Theme Tokens
- **Background**: `bg-app-bg` (Neutral backgrounds)
- **Surface**: `bg-app-surface` (Card and panel surfaces)
- **Primary**: `text-app-primary` / `bg-app-primary` (Action items, highlights)
- **Borders**: `border-app-border` (Subtle dividers)
- **Text**: `text-app-text` (Main content), `text-app-text-muted` (Labels/Secondary)

### Layout Patterns
- **Shell**: Every page is rendered within `ShellLayout.tsx`, featuring a 64w sidebar and a scrollable main content area.
- **Header**: Standardized header height with a 64x64 icon box (bg-app-primary), `text-xl` font, and `backdrop-blur` surface.
- **Sidebar & Panels**: Tool sidebars are standardized to `w-80`. Main content areas should use the `bg-app-surface/30` background with `rounded-2xl` and `border-app-border`.
- **Responsiveness**: Focus on desktop-first professional use, but maintain fluid layouts for large monitors.

## Industry Context (Lighting Design)
New tools should leverage the following domain knowledge:
- **IES Files**: Understand the structure of IES photometric data for distributions.
- **Photometry**: Logic for luminance (cd/m²), illuminance (fc/lux), and isoline generation.
- **Image Analysis**: Processing HDR and EXR files for luminance maps via the Python backend.
- **Standards**: Reference IES (Illuminating Engineering Society) standards for calculation methods.

## Development Patterns
- **Parallel Processing**: When handling multiple files, use `Promise.all` for concurrent processing to maintain "Flash" speed.
- **On-Demand Streaming**: For resource-intensive tasks (like PDF diffing), use a "Lazy Hydration" model. Only fetch high-res previews or heavy data when a specific item is selected/focused to avoid Server OOM errors.
- **API Communication**: The frontend communicates with the backend via `/render`, `/upload`, `/isoline`, and `/change-narrative` endpoints using a session-based image store.
- **Routing**: Add new features to `App.tsx` and register them in the `ShellLayout.tsx` navigation sidebar.
