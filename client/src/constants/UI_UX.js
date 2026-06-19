export const STANDARD_MODAL_PROPS = {
  align: "items-start",
  size: "max-w-[97.5%] max-h-[calc(100%-4.15rem)] h-[calc(100%-4.15rem)]"
};

export const Z_LAYERS = {
  OVERLAY: 100,      // Settings, Dashboard, Transactions View overlays, and Modal backdrop
  MODAL_CONTENT: 110, // Inner content, close buttons, modal headers
  BOTTOM_NAV: 120    // Bottom Navigation Bar
};

export const SAFE_AREAS = {
  TOP_CLEARANCE: "pt-4" // Safe-area top padding
};
