# Expo Rect Native Modal & Conditional Render Flicker Fixes

## 📝 The Problem

When rendering overlays, popups, or authentication lock screens in React Native / Expo, users frequently experience "flickers" or "flashes" when the component mounts or unmounts. Sometimes these appear as a white screen flashing briefly, sometimes the content appears empty and then fills in a fraction of a second later, or sometimes the modal "jumps" into place.

## 🐛 Root Causes & Solutions

### 1. The "Conditional Mount" Flash (Full Screen Re-render)

**The Bug:** Using basic conditional logic (`if (isLocked) return <LockScreen />`) to swap out entire navigation stacks or screens. When the condition flips, React Native destroys the entire current layout tree (e.g., the `Stack` navigator) and builds the new one from scratch. The native bridge cannot do this instantly, causing a noticeable frame drop or white flash.

**The Fix:** Wrap the locking screen in a full-screen `<Modal>` and keep the main app tree mounted underneath at all times.

```tsx
// ❌ BAD: Destroys the main app tree, causing a white flash when unlocking
if (isLocked) {
  return <LockScreen onUnlock={() => setIsLocked(false)} />;
}
return <Stack />;

// ✅ GOOD: Renders on top of the existing app. Unlocking just removes the modal.
return (
  <>
    <Stack />
    <Modal visible={isLocked} animationType="none" statusBarTranslucent>
      <LockScreen onUnlock={() => setIsLocked(false)} />
    </Modal>
  </>
);
```

### 2. The "State Sync" Flicker (Late Data Hydration)

**The Bug:** Relying on the `Modal`'s `onShow` callback (or a `useEffect` that listens for `visible === true`) to populate form data or state inside the modal. The modal renders visibly on the screen *first* with empty/stale state, and *then* the `onShow` triggers a `setState`, re-rendering the component with the real data mid-display.

**The Fix:** Use the **Controlled Component Pattern**. The parent component must set the state *before* or *during* the exact same render batch that sets `visible` to `true`.

```tsx
// ❌ BAD: Modal has internal state that updates after it becomes visible
function EditModal({ visible }) {
  const [name, setName] = useState('');
  useEffect(() => { if (visible) setName(profile.name) }, [visible]); 
  // Result: Renders empty instantly, updates a split-second later (flicker)
}

// ✅ GOOD: Parent owns the state and passes it down.
// In the parent:
function openModal() {
  setFormData({ name: profile.name }); // State is ready immediately
  setModalVisible(true);
}

// In the child wrapper:
<EditModal visible={visible} form={formData} />
```

### 3. The "Android Layout Bounce" (Status Bar & Keyboard)

**The Bug:** Transparent modals on Android often have a visual jump when animating in. Usually they calculate their height, subtract the status bar height, snap down 24-48 pixels, and then snap back. `KeyboardAvoidingView` on Android doing explicit height calculations during the mount animation worsens this.

**The Fix:** Use specific hardware and layout props on the `Modal` and disable JavaScript-based keyboard calculations on Android.

```tsx
<Modal
  visible={visible}
  animationType="fade" // 'slide' forces aggressive native bounds measurements
  transparent
  statusBarTranslucent // CRITICAL: Stop Android from rendering below the status bar, shifting UI down
  hardwareAccelerated  // Forces the GPU to handle the modal layer
>
  {/* Let Android's native windowSoftInputMode handle the keyboard. Only use padding on iOS. */}
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
    style={{ flex: 1 }}
  >
    {/* Content */}
  </KeyboardAvoidingView>
</Modal>
```

## 🚀 Summary Checklist
*   Never use `return <Component />` conditionals for temporary overlays; use `<Modal>`.
*   Strip internal state out of modals. The parent should pass fully-hydrated props when requesting the modal to open.
*   Always include `statusBarTranslucent` on Android modals to prevent the 24px vertical shift jump.
*   Let Android manage its own keyboard behavior natively; only apply `KeyboardAvoidingView behavior="padding"` or `"height"` on iOS.
