# 📊 Citadel Dashboard Configurations & Architectural Specification

This document serves as the master technical reference and configuration guide for the Eldoria/Citadel Command Dashboard. It explains the mechanics, state synchronization, layout engines, and crucial workarounds implemented to ensure stability.

---

## 🗂️ Table of Contents
1. [Core Layout Grid & CSS Scaling Engine](#1-core-layout-grid--css-scaling-engine)
2. [Interaction Locking & Event Shielding](#2-interaction-locking--event-shielding)
3. [Layout Collision & Grid Alignment Geometry](#3-layout-collision--grid-alignment-geometry)
4. [Dashboard Store & Migration Lifecycle](#4-dashboard-store--migration-lifecycle)
5. [Interactive Filters & State Syncing](#5-interactive-filters--state-syncing)

---

## 1. Core Layout Grid & CSS Scaling Engine

The dashboard coordinates and rendering flow are handled inside [DashboardCanvas.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/DashboardCanvas.jsx).

### CSS Scale Math
Rather than constantly reflowing the coordinates of `react-grid-layout` when drawers open or screens resize, the dashboard uses a virtual grid resolution of **1200px** and scales the container using a CSS transform matrix:
* **ResizeObserver**: Observes the outer workspace width.
* **Scale calculation**: `Math.min(newWidth / 1200, 1.0)`.
* **Scaling Wrapper**:
```javascript
<div
  style={{
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: '1200px',
    height: `${100 / scale}%`
  }}
>
```
* **Why `100 / scale` height is used**: Rescaling the container shrinks its visual height. Setting the height to `100 / scale %` mathematically forces the scaled grid to stretch back, filling the vertical viewport space and preventing layout truncation.

### The Focus Scroll Lock Jitter Workaround
Because the scaled container height `100 / scale %` makes the inner div taller than its parent bounding box (which is styled with `overflow-hidden`), clicking or focusing on elements in the bottom half of widgets causes the browser to natively trigger a focus scroll.
* **The Symptom**: The entire grid shifts or "jumps" upwards, and cannot be scrolled back because there are no scrollbars.
* **The Solution**: An explicit `onScroll` snap-back listener locks both scroll offsets to `0` on the parent container wrapper:
```javascript
onScroll={(e) => {
  e.currentTarget.scrollTop = 0;
  e.currentTarget.scrollLeft = 0;
}}
```

---

## 2. Interaction Locking & Event Shielding

Grid movement (drag-and-drop / resizing) is strictly confined to **Edit Mode** (`isEditingLayout === true`).

### RGL Lock Props
Draggable and Resizable flags are bound to the store's edit state:
```javascript
isDraggable={isEditingLayout}
isResizable={isEditingLayout}
```

### Event Shields (Mousedown / Touchstart)
To prevent `react-grid-layout` from receiving interactions when in View Mode (`isEditingLayout === false`), we wrap the inner widget components in an event shield that intercepts and kills drag-initiating events before they bubble up to the parent grid item container:
```javascript
<div 
  className={`w-full h-full ${isEditingLayout ? 'pointer-events-none select-none' : ''}`}
  onMouseDown={(e) => {
    if (!isEditingLayout) {
      e.stopPropagation();
    }
  }}
  onTouchStart={(e) => {
    if (!isEditingLayout) {
      e.stopPropagation();
    }
  }}
>
  <WidgetComponent />
</div>
```
* **Edit Mode**: The `pointer-events-none` class disables interactions on the inner shield, letting mouse clicks pass directly to `react-grid-layout` for standard drag-and-drop.
* **View Mode**: The shield is active. Mouse and touch clicks stop propagating at this div, completely locking the parent grid items while allowing internal buttons/filters to function.

### Targeted Transitions vs. Transform Conflicts
Tailwind's `transition-all` class causes animation conflicts because `react-grid-layout` handles position coordinates via inline `transform: translate(x, y)` values. When a widget updates its loading state (`isFetching`), it triggers a re-render where the transition animates the transform change, causing a "shake" or "jump".
* **Solution**: Replace `transition-all` with targeted transitions:
```scss
transition-[border-color,box-shadow,background-color]
```

---

## 3. Layout Collision & Grid Alignment Geometry

The AP/AR Command Dashboard operates on a strict **12-column grid** layout defined in [useDashboardStore.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/store/useDashboardStore.js).

### Layout Preset Sizing (`DEFAULT_INTERACTIVE_PRESET`)
To prevent `react-grid-layout` from automatically triggering collision resolution (which pushes widgets down to lower rows and causes visual jumping), the layout coordinates must satisfy the minimum dimensions (`minW` and `minH`) defined in the registry:
* **Row 0 (Header Controls)**: Total columns = 12.
  * `inter_granularity-1`: `w: 4`, `x: 0`, `y: 0` (minW: 3)
  * `inter_date_picker-1`: `w: 4`, `x: 4`, `y: 0` (minW: 4)
  * `inter_status-1`: `w: 4`, `x: 8`, `y: 0` (minW: 3)
* **Row 1 (Chronological Arrears)**: Total columns = 12.
  * `inter_arrear-1`: `w: 12`, `h: 1`, `x: 0`, `y: 1` (minW: 6)
* **Row 2 (Detailed Breakdown & Ledger)**: Total columns = 12.
  * `inter_category-1`: `w: 4`, `h: 4`, `x: 0`, `y: 2` (minW: 3)
  * `inter_entity-1`: `w: 4`, `h: 4`, `x: 4`, `y: 2` (minW: 3)
  * `inter_ledger-1`: `w: 4`, `h: 4`, `x: 8`, `y: 2` (minW: 4)

---

## 4. Dashboard Store & Migration Lifecycle

Layout configurations are persisted in Supabase (`profiles.dashboard_layouts`) and cached locally in `localStorage` under `eldoria_dashboard_layouts`.

### Auto-Reset Migration Step
If a user's cached layout coordinates contain old version values (e.g. if the Date Range Selector has `w < 4`), it will cause collisions and visual jumps. The store's hydration method `hydrateLayouts()` includes a migration step to automatically correct the cache:
```javascript
apar_interactive: (savedLayout?.apar_interactive && !savedLayout.apar_interactive.some(item => item.i === 'inter_date_picker-1' && item.w < 4)) 
  ? JSON.parse(JSON.stringify(savedLayout.apar_interactive)) 
  : JSON.parse(JSON.stringify(DEFAULT_INTERACTIVE_PRESET))
```

---

## 5. Interactive Filters & State Syncing

Interactive filtering updates are synchronized using Zustand (`useInteractiveStore`) and TanStack Query (`useInteractiveData`):

### Zustand Store (`useInteractiveStore.js`)
Stores date picker boundaries, category filter strings, granularity values, and statuses:
```javascript
setFilter: (key, value) => set((state) => {
  const newFilters = { ...state.filters, [key]: value };
  return { filters: newFilters };
})
```

### TanStack Query Caching & DOM Preservation
All widgets subscribe to the same query hook [useInteractiveData.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/hooks/useInteractiveData.js). To prevent widgets from collapsing or resetting their DOM height when a query is loading, the hook is configured with:
```javascript
placeholderData: keepPreviousData, // Keeps stale layout details visible during loading
staleTime: 1000 * 60 * 5,          // Caches queries for 5 minutes
```
This guarantees that the widgets never unmount or trigger layout jumps during network requests.
