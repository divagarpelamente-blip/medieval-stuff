# 🛠️ Sandbox Integration Guide: Eldoria

This guide provides step-by-step instructions on how to temporarily inject the `SettingsSandbox` component into the Eldoria client for testing, and how to safely revert the changes back to the production-ready state.

---

## 🚀 Step 1: Enable the Sandbox Mode

To display the settings sandbox at the top of the viewport, modify the main entry file [client/src/App.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/App.jsx):

### 1. Add the Import Statement
Open [App.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/App.jsx), scroll to the top of the file where other files are imported, and add the following import:

```javascript
import SettingsSandbox from './components/SettingsSandbox';
```

### 2. Mount the Sandbox in the UI
Scroll down to the main `return` statement of the `App` component (around line 1032) and mount the component at the very top of the returned tree:

```javascript
  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-black flex items-center justify-center">
      <SettingsSandbox />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#f4e4bc',
            color: '#4b2c20',
            borderColor: '#8b4513',
            borderWidth: '2px'
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
          },
        }}
      />
```

---

## ⏪ Step 2: Revert Back to Initial State

To restore the standard game layout and remove the sandbox, follow these steps:

### 1. Remove the Import Statement
Open [App.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/App.jsx) and delete the import statement:

```diff
-import SettingsSandbox from './components/SettingsSandbox';
```

### 2. Unmount the Sandbox from the UI
Scroll to the main `return` statement and delete the `<SettingsSandbox />` component:

```diff
  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-black flex items-center justify-center">
-      <SettingsSandbox />
       <Toaster 
         position="top-center" 
```
