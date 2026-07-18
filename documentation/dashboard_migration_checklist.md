# Eldoria V2.1 Dashboard Migration Checklist

This unified master document merges your static component extraction with your dynamic layout engine architecture into a single, cohesive execution path.

## Phase 1: The Aggregation Engine & Sandbox Base
- [x] Create `utils/chartAnalytics.js`: Established the core data aggregation pipeline.
- [x] Monthly Performance Parser: Implemented `generateCashFlowData()` to group monthly income vs. expenses.
- [x] Chronological Trend Aggregator: Implemented `generateNetTrendData()` to calculate net position.
- [x] COA Category Parser: Implemented `generateCategoryBreakdown()` using 8-digit COA prefix groupings.
- [x] Dependency Check: Run `npm install recharts react-grid-layout @tanstack/react-query` in the client directory.

## Phase 2: Component Extraction & Widget Registration
Strip TypeScript types and reskin the legacy components into modular, registration-ready dashboard widgets using the dark-stone/amber aesthetic.
- [ ] CashFlowChart.jsx Extraction:
  - Apply dark-stone/amber base formatting.
  - Implement dual-bar rendering utilizing Emerald (Income) and Rose (Expenses).
- [ ] NetWorthChart.jsx Extraction:
  - Implement chronological trend line styling utilizing Amber/Gold gradients.
- [ ] AssetAllocationChart.jsx Extraction:
  - Build custom Eldoria dark-fantasy palette arrays for pie slices.
- [ ] The Widget Registry: Establish a `widgetRegistry.js` map configuration file detailing dimensions (`minW`, `maxW`, `minH`, `maxH`) and reference pointers for each extracted chart.

## Phase 3: Server State & Client Configuration Layers
Before building UI elements, establish the data management layer to ensure optimal performance.
- [ ] TanStack Query Configuration: Set up the provider wrapper. Migrate chart data hooks to utilize React Query caching to deduplicate identical Supabase API calls across widgets.
- [ ] System Configurations (`dashboard.config.js`): Create a frontend configuration file to store global invariants like `MAX_WIDGETS_PER_TAB` (set to 8) to maintain client-side rendering performance.
- [ ] Zustand Store Expansion:
  - Add `isEditingLayout` boolean toggle to trigger global "Stance Changes."
  - Implement `draftLayout` tracking to hold live-preview alterations separate from saved production state.
  - Add Submenu visibility state arrays handling visibility flags (`isVisible`) and naming strings for 6 available tabs.

## Phase 4: The Dynamic Drag-and-Drop Canvas
Replace the hardcoded grid structure inside your sandbox with a fluid layout system.
- [ ] The App Header Stance Change: Program the Top Bar to read the `isEditingLayout` state. Morph the default "Settings" button into a green "Save Changes" and a red "Cancel / Revert" button combo.
- [ ] `react-grid-layout` Integration: Implement the physics grid layer into the main canvas. Bind it to read from `draftLayout` during edit states.
- [ ] Active Canvas Modifiers:
  - Add code to display an absolute-positioned "X" deletion button over widgets when editing.
  - Inject dynamic layout baseline defaults ("Standard 1") whenever a hidden tab is toggled to active, preventing blank canvas errors.
- [ ] Layout Physics Verification: Verify items seamlessly swap positions, scale correctly to registry limits, and push non-selected visuals dynamically before dropping.
- [ ] Responsive Breakpoints: Write a window listener that bypasses grid coordinate logic on small screens, forcing layout blocks into a legible, vertical single-column stack.

## Phase 5: Configuration Panel UI & Adaptation
Build the visual controls to alter the states configured in Phase 3.
- [ ] Layout Shell: Create the settings menu interface.
  - Desktop Mode: Animates out as a clean, right-side sliding panel.
  - Mobile Mode: Renders as a bottom-sheet drawer covering only the bottom 45% of the viewport to preserve the upper canvas live preview.
- [ ] Section A (Submenu Manager): Map Tabs 1–6 showing Eye icons (toggling visibility parameters) and Pencil icons (which morph text fields into text inputs for quick renaming).
- [ ] Section B (Views Gallery): Build a gallery of predefined template configurations ("Standard 1", "Split Canvas") that overwrite `draftLayout` tracking arrays with a single click.
- [ ] Section C (Draggable Widget List): Render lists of registry components styled as grabbable element boxes. Map their drag handles directly to append objects onto the grid engine canvas.

## Phase 6: Sync & Database Persistence
- [ ] Schema Definition: Generate the `dashboard_preferences` table in Supabase.
- [ ] State Synchronization Hooks: Build the save trigger to write stringified master JSON configurations upstream to Supabase when the user clicks "Save Changes."
- [ ] Component Migration Cleanups: Convert any leftover legacy components (such as FinSight metrics summary cards or recent transaction tables) into modular engine widgets.

## 📌 Pinned Execution Directives
- **Visual Polish**: Empty drop zones must render with a faint amber/gold glowing border indicating cell alignment previews during drag interactions.
- **Z-Index Hierarchy**: Set active dragged elements to a higher Z-index layer than Recharts tooltip wrappers to prevent visual rendering glitches during layout re-arrangements.
- **UX Notifications**: Tie state changes directly into toast popups ("Changes Saved to Vault", "Tab Slot Limit Encountered").
