# Eldoria V2.0 Build Mode Export Checklist

Use this report as a checklist when exporting codebase components for Google AI Studio's **Build Mode** to construct accurate UI mockups.

---

## 📌 Files to Attach (UI, State, and Styling)
Attach these files to provide layout, styling, and state model parameters.

- [ ] **Tailwind Configuration**
  * **File:** [client/tailwind.config.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/tailwind.config.js)
  * **Rationale:** Establishes custom color tokens and styles used for the medieval theme layout.
- [ ] **Global CSS Rules**
  * **File:** [client/src/index.css](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/index.css)
  * **Rationale:** Contains `@tailwind` directives and global medieval component overrides.
- [ ] **Main Layout Wrapper**
  * **File:** [client/src/App.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/App.jsx)
  * **Rationale:** Outlines the core viewport structure, including the **Desktop Void Wrapper** (`w-screen h-screen bg-black flex justify-center`) and HUD/navigation placement.
- [ ] **Safe Area Metrics**
  * **File:** [client/src/constants/UI_UX.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/constants/UI_UX.js)
  * **Rationale:** Outlines `SAFE_AREAS` values that govern header HUD and footer menu margins.
- [ ] **State & Matrix Selectors**
  * **File:** [client/src/store/useKingdomStore.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/store/useKingdomStore.js)
  * **Rationale:** Details the Zustand store structure, containing the V2.0 gamification attributes (gold, gems, xp, level) and dynamic cascading matrix selectors.
- [ ] **Atmospheric Medieval Modal System**
  * **Files:**
    * [client/src/components/Modals/Modal.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/Modal.jsx) — Base frame layout and styling
    * [client/src/components/Modals/ModalSubmenus.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/ModalSubmenus.jsx) — Navigation list buttons wrapper
    * [client/src/components/Modals/ModalTabmenus.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/ModalTabmenus.jsx) — Tab-based layout switcher wrapper
  * **Rationale:** Provides the modular UI component layer that handles atmospheric screen popups.
- [ ] **Kingdom View Controllers**
  * **Files:**
    * [client/src/components/Modals/TreasuryController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/TreasuryController.jsx) — Handles financial menu state logic
    * [client/src/components/Modals/SettingsController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/SettingsController.jsx) — Handles citadel preferences configuration tabs
  * **Rationale:** Manages UI state transitions inside popups, decoupling routing from the main menu canvas.

---

## 🚫 Files to Exclude (Backend and Auth)
Omit these files to bypass authentication checks and database connections in the mockup environment.

- [x] **Database Client**
  * **File:** [client/src/lib/supabaseClient.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/lib/supabaseClient.js)
  * **Rationale:** Avoid running live database calls or initializing remote connections in a preview mockup.
- [x] **Authentication Wall**
  * **File:** [client/src/components/auth/Login.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/auth/Login.jsx)
  * **Rationale:** The preview should bypass the login authentication wall to allow mock page visibility.
