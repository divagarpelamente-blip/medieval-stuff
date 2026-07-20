## Phase 0: Production Integration Roadmap - Final UI/UX & Mechanics Patch

**1. Dashboard Header & Submenu UI Refinements**
*   **Submenu Grid Stabilization:** Refactored the submenu navigation into a fixed-width (`w-[640px]`) 4-column CSS grid. This successfully forces a 3-top / 4-bottom layout wrap.
*   **Text Constraint:** Applied strict `whitespace-nowrap`, `overflow-hidden`, and `text-ellipsis` utilities to menu buttons to prevent text bleeding and enforce identical button geometries.
*   **Global Exit Control:** Deployed a persistent circular Red Exit button (with a yellow 'X') to the header controls for intuitive workspace closure.

**2. Grid Scaling Engine (DashboardCanvas)**
*   **CSS Scaling Engine:** Replaced the aggressive layout-recalculating `ResizeObserver` with a CSS `transform: scale()` matrix. 
*   **Coordinate Preservation:** The grid now maintains a strict 1200px virtual resolution and smoothly "zooms out" when the sidebar pushes it. This completely prevents react-grid-layout from mutating widget coordinates or breaking the layout when toggling the options drawer.

**3. Global Interaction Mechanics & Stance Unlocking**
*   **Removed Interaction Locks:** Stripped the `isEditingLayout` security guards from the grid's `isDraggable` and `isResizable` properties, as well as the store's `updateDraftLayout` action. Users can now move and resize widgets dynamically, regardless of whether the options sidebar is open.
*   **Deletion Guard:** Maintained strict conditional rendering on the widget dismantle button (Red 'X' HUD), ensuring structures can only be deleted when explicit configuration mode is active.
*   **Real-time Auto-Save:** Leveraged `onDragStop` and `onResizeStop` grid events to dynamically commit new coordinates to the database immediately after a widget is dropped.

**4. Data Safety Nets & Race Condition Resolution**
*   **Unconditional Exit Checkpoint:** Upgraded the Red Exit button to unconditionally trigger a `window.confirm` prompt on click, serving as an absolute fail-safe to ask the user to save or discard changes before the window closes.
*   **Race Condition Fix:** Implemented a strict `await saveDraftToProduction()` Promise lock on the exit sequence. The system now completely pauses unmounting until the Supabase database transaction is 100% committed, preventing the dashboard from fetching stale data on re-entry.
*   **Event Routing:** Wired the Exit button to dispatch a custom `close-dashboard` window event, perfectly intercepted by a new `useEffect` in `MainMenu.jsx` to unmount the view and return the user to the core shell.
