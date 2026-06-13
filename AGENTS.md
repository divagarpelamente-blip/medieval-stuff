# Eldoria Dashboard Design Standards & Layout Guidelines

This document establishes the exact UI structural baseline for all Financial Report tabs in the **Eldoria** dashboard. All current and future sub-tabs must adhere strictly to these patterns to ensure aesthetic cohesion, layout stability, and functional uniformity.

---

## 1. Architectural Layout Structure

The dashboard interface uses a multi-layered viewport-locking layout (`100dvh` or `h-full overflow-hidden` wrapper) designed to prevent elastic scroll anomalies on mobile devices while maximizing screen space.

### A. The Left Sidebar (Filters Panel)
*   **Dimensions & Stacking**: Fixed width of `w-36 lg:w-40` on desktop, absolute drawer toggled via `isSidebarOpen` on mobile (`md:block`).
*   **Background & Borders**: Solid parchment-overlay backdrop (`bg-[#faf4e5]/90 border-r border-[#8b4513]/25`).
*   **Scroll Behavior**: Independent scroll container (`overflow-y-auto custom-scrollbar-subtle`).
*   **Interactive Controls**:
    *   **Selection States**: Checkboxes use custom styled boxes (`w-3 h-3 rounded border flex items-center justify-center`). Selected state uses `bg-[#8b4513] border-[#8b4513]` with an inner gold square (`w-1.5 h-1.5 bg-[#ffd700] rounded-sm`).
    *   **Interactive States**: Active button filters use `bg-[#8b4513] border-[#8b4513] text-[#ffd700]` for selected items and `bg-transparent border-[#8b4513]/20 text-[#5d4037]` for unselected items.
    *   **Typography**: Filter section headers are styled with `.text-[10px] font-black uppercase tracking-widest text-[#4b2c20]`.

### B. Top Navigation
*   **Tab Selector Bar**: A horizontal pill navigation container styled with `.bg-[#faf4e5]/40 border-b border-[#8b4513]/25`.
*   **Selector Buttons**: Rounded pill selectors (`rounded-lg border font-black text-[9px] uppercase tracking-wider`). Selected tabs use the primary dark-brown theme `bg-[#8b4513] text-[#ffd700]`, while inactive ones use the parchment-overlay `bg-[#faf4e5]/80 text-[#5d4037]/80 hover:bg-[#8b4513]/10`.

### C. The Top Fixed KPI Summary Row
*   **Layout Grid**: A dynamic horizontal grid (`grid grid-cols-1 sm:grid-cols-${kpis.length} gap-1 sm:gap-1.5 bg-[#f4e4bc] border-b border-[#8b4513]/10 pb-2 z-20`) located at the top of the main container, adjusting column width based on the active tab's card count.
*   **KPI Card Design**: Each card uses a rounded parchment overlay (`bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-1.5 sm:p-2 flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden`).
*   **Icons**: Subtly rendered bottom-right absolute indicator emojis (`absolute right-1 bottom-1 text-lg opacity-15`).
*   **Values**: Must utilize compact currency formatting (`+23.2K / g` or `(4.5K) / g`) to prevent layout breaks.

### D. Scrollable Content Area (Charts & Insights)
*   **Stacking Context**: Located below the KPI row, utilizing a scrollable frame (`flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-8 mt-4`).
*   **Two-Column Split Layout**: On large viewports (`grid-cols-1 lg:grid-cols-2 gap-4`), each visualization chart is paired side-by-side with a corresponding **Royal Treasurer's Counsel** insight block (`RoyalTreasurerInsights`). On smaller screens, they collapse gracefully into a single-column vertical stack.
*   **Centered Chart Headers**: All visualization charts must center their titles (`flex justify-center items-center text-center`) to fit the medieval ledger aesthetic.

---

## 2. Global Theming & Color Palette

To preserve the premium medieval look, all components must utilize the following styling tokens:

| Element | CSS / Tailwind Utility | Description |
| :--- | :--- | :--- |
| **Main Background** | `bg-[#f4e4bc]` | Warm medieval gold/parchment background |
| **Parchment Overlay**| `bg-[#faf4e5]/60` | Semi-transparent parchment layer for cards and sidebars |
| **Borders** | `border-[#8b4513]/25` | Soft brown/wood leather borders |
| **Gold Highlights** | `text-[#ffd700]` or `bg-[#ffd700]` | Guilded gold color for selections and key titles |
| **Dark Brown Text** | `text-[#4b2c20]` | Primary medieval font ink color |
| **Medium Brown Text**| `text-[#5d4037]` | Secondary ink color |
| **Positive Accents** | `text-emerald-700` | Vault growth indicators |
| **Negative Accents** | `text-rose-700` | Deficit and expense indicators |
| **Fonts** | `font-serif` / `title-font` / `font-mono` | Serifs for body/quotes, heavy sans for headers, monospaced digits for coin values |

---

## 3. Reusable Wrapper Wrapper Component

The dashboard layout structure is unified under the `BaseDashboardTab` component. This component encapsulates the Left Sidebar and Top Tab Navigation, providing a standardized layout for any dashboard view:

```jsx
import BaseDashboardTab from './components/BaseDashboardTab';

// Usage example:
<BaseDashboardTab
  t={t}
  dashSubTab={activeSubTab}
  setDashSubTab={setActiveSubTab}
  subTabs={availableSubTabs}
  isSidebarOpen={isSidebarOpen}
  setIsSidebarOpen={setIsSidebarOpen}
  selectedYears={selectedYears}
  setSelectedYears={setSelectedYears}
  uniqueYearsList={uniqueYearsList}
  selectedQuarters={selectedQuarters}
  setSelectedQuarters={setSelectedQuarters}
  selectedMonths={selectedMonths}
  setSelectedMonths={setSelectedMonths}
  monthOptions={monthOptions}
  isFallbackState={isFallbackState}
  kpis={kpiList}
>
  {/* Sub-tab main scrollable charts/content go here */}
</BaseDashboardTab>
```
