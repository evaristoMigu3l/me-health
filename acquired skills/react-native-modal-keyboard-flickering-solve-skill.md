# Solving Android Modal Keyboard Jitter and Overlap in React Native

## Problem Encountered
When placing editable text `TextInput` fields inside a `<Modal transparent={true}>` component, we encountered two significant issues:
1. **Overlap:** The Android keyboard was completely covering the bottom input fields, preventing the user from typing.
2. **Flickering/Jumping:** After applying to a standard `<KeyboardAvoidingView behavior="padding">`, the moment the bottom inputs were clicked, the entire screen flashed/flickered dramatically when the keyboard slid open or closed.

## Intelligent Diagnosis
1. **The Overlap Root Cause:** Modals in React Native that use `transparent={true}`, combined with `statusBarTranslucent`, override Android's standard `windowSoftInputMode="adjustResize"` functionality. The modal simply stays layered on top, not resizing for the keyboard. This prevents `<ScrollView>` from moving the active input up into the viewport naturally.
2. **The Flickering Root Cause:** In our Expo project (`app.json`), the `softwareKeyboardLayoutMode` was actually configured to `"pan"` (often called `adjustPan` natively). This setting forces Android to natively slide the *entire application window* upward so the focused input isn't obstructed.
Because Android is natively translating (panning) the view at a framework level, having our JavaScript `KeyboardAvoidingView` apply its own layout padding (`behavior="padding"`) actively fights the native window manager! JS layout calculations delay slightly behind the native OS window changes, causing double movement resulting in a massive flicker/jump.

## How it was solved
To stop them from fighting each other, we separated responsibilities by Platform. The iOS platform requires `<KeyboardAvoidingView>` padding layout because iOS does not natively have an equivalent `adjustPan` for complex scroll-views. Therefore:
1. We retained `<KeyboardAvoidingView>` wrapped strictly around the Modal's interactive `ScrollView` content.
2. We changed the `behavior` property to intelligently decouple from Android: 
   ```tsx
   behavior={Platform.OS === 'ios' ? 'padding' : undefined}
   ```
By defining it as `undefined` for Android, `KeyboardAvoidingView` effectively acts as a pass-through layer that does NOT add conflicting layout-based padding, and instead allows Android's fast, native `"pan"` (`softwareKeyboardLayoutMode`) translation to flawlessly push the Modal up without ANY flicker or jitter. 

## Code Implementation Applied:
```tsx
import { Modal, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';

export default function MyModal() {
    return (
        <Modal
            visible={true}
            transparent
            statusBarTranslucent
            hardwareAccelerated
        >
            <KeyboardAvoidingView 
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={{ maxHeight: '90%' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {/* Interactive TextInputs go here */}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
```

## Takeaway & Skill Acquired
- **Never stack JS Layout Keyboard Managers with Native Panning:** If native `app.json` configuration states `softwareKeyboardLayoutMode: "pan"`, avoid forcing `KeyboardAvoidingView behavior="padding"` on Android at the exact same time. It avoids violent UI flickering.
- Always fall back to `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` in these edge cases.
