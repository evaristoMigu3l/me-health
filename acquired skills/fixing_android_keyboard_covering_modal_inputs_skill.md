# Fixing Android Keyboard Covering Modal Input Fields Skill

## Problem Description
In an Expo / React Native Android application, inside a bottom sheet or a custom `Modal`, when the user focuses on inputs (such as full name, email, date, ethnicity), the Android system keyboard slides up and completely covers/obscures the input fields. The user cannot see what they are typing, and attempting to scroll up inside the `ScrollView` does not work.

Additionally, starting the Expo bundler via `npx expo start` on Windows fails when the project path contains special characters like `&` (e.g., `Me & health v 2.0`), throwing errors such as:
`'health' is not recognized as an internal or external command` or `TypeError: fetch failed`.

---

## Technical Analysis & Root Causes

### 1. Keyboard Covering Inputs inside Modal
There are three main contributors to this issue on Android:
- **`softwareKeyboardLayoutMode` configuration:** In the project's `app.json`, `android.softwareKeyboardLayoutMode` was set to `"pan"` (equivalent to `adjustPan` in the AndroidManifest). In `"pan"` mode, Android shifts the entire viewport up but does not resize the layout. However, a React Native `Modal` creates its own native window on Android, and `adjustPan` fails to pan the modal's window, meaning the keyboard just overlaps on top.
- **`KeyboardAvoidingView` Behavior:** The `behavior` prop of the `KeyboardAvoidingView` wrapping the modal content was set to `undefined` for Android (`Platform.OS === 'ios' ? 'padding' : undefined`). Without behavior specified, `KeyboardAvoidingView` does nothing on Android.
- **`ScrollView` Scroll constraints:** The container lacked sufficient bottom padding/height adjustments, which prevented the user from scrolling the active input into view when the keyboard was open.

### 2. Windows Path & DNS Resolution Issues
- **Path Parsing Error:** The `&` character is a command separator in Windows CMD and PowerShell. When `npx` or standard Expo scripts run commands, they execute nested scripts using string interpolation. Without correct quoting, the path gets split at `&` (e.g., executing `Codehub_react\Me` as one command and `health v 2.0\...` as another), causing a shell crash.
- **Node 18+ DNS Fetch Fail:** Node.js v18+ changed its DNS resolution priority to prefer IPv6, causing local fetches (like checking if Metro is alive on `localhost:8081`) to throw `TypeError: fetch failed` on certain network interfaces.

---

## Intelligent Solutions & Implementations

### Step 1: Update App Configuration (`app.json`)
Change the keyboard layout mode from `"pan"` to `"resize"` (which corresponds to `adjustResize`). This instructs the Android OS to shrink the application window height when the keyboard opens, giving the layout (and `ScrollView`s) space to adapt.

```json
{
  "expo": {
    ...
    "android": {
      "softwareKeyboardLayoutMode": "resize",
      ...
    }
  }
}
```

### Step 2: Configure KeyboardAvoidingView & ScrollView
Modify the modal component (`EditProfileModal.tsx`) to:
1. Set `behavior="padding"` on **iOS only** and leave it **`undefined`** on Android.
2. Add a `keyboardVerticalOffset` if needed (set to `0` initially).
3. Increase `contentContainerStyle` bottom padding in the nested `ScrollView` (e.g., to `40`) to ensure lower elements can easily scroll past the keyboard edge.
4. Disable bounce effect to keep scroll scrolling performance clean.

> [!IMPORTANT]
> Since we set `softwareKeyboardLayoutMode` to `"resize"` in `app.json`, the Android system will automatically resize the screen window. Setting `behavior="padding"` on Android would cause **double-avoidance** (both systems fighting to push/resize the layout), resulting in layout jumps and visual flickering when closing the keyboard. Leaving it `undefined` on Android allows the OS to do it smoothly.

```tsx
<KeyboardAvoidingView 
    style={styles.overlay} 
    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
>
    <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            bounces={false}
        >
            {/* Input fields */}
        </ScrollView>
    </View>
</KeyboardAvoidingView>
```

### Step 3: Run Expo Server bypassing Path and DNS issues
To start the Expo dev server on Windows inside a directory containing an `&` in its name without getting path or `fetch failed` errors, run Node directly using a relative path to the Expo CLI, and specify IPv4 DNS resolution:

```powershell
$env:NODE_OPTIONS="--dns-result-order=ipv4first"; node .\node_modules\expo\bin\cli start --clear
```
- **`node .\node_modules\expo\bin\cli`** bypasses `npx` global resolver path expansions.
- **`$env:NODE_OPTIONS="--dns-result-order=ipv4first"`** tells Node to use IPv4 DNS resolution first, preventing `fetch failed` errors.
