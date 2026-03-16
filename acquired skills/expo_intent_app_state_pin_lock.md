# Expo Intent AppState PIN Lock Grace Period + Skill

## The Problem
When implementing a `PIN Lock` verification overlay system in React Native / Expo, we initially tied the security prompt to an `AppState` listener. The logic triggered the lock overlay whenever the application transitioned from `active` to `inactive` / `background` state, acting as a security measure to keep unauthorized eyes away after locking off your screen.

However, a serious annoyance surfaced: **"Every time the user opens their phone storage or camera to upload a file (via Expo Document Picker / Image Picker), it takes them away from the `active` AppState"**. 
Since we initially hardcoded a minor 60-second grace period (to account for the `active -> inactive -> background` switch delay), users who naturally took more than a minute to browse their galleries and select files were abruptly greeted by the frustrating PIN screen upon attempting exactly the activity! It locked instantly, ruining the user flow.

## The Errors Encountered
- **UX Frustration**: A false-positive security action that penalized basic operations like opening a native File Picker.
- Expo triggers native OS intents, making React Native `AppState` lose its foreground context natively. 

## How we Intelligently Solved It
We diagnosed that `AppState.current` transitions logic wasn't at fault, but rather the hardcoded _60000ms_ tolerance allowed for interactions out of focus. A regular PIN timer meant to kick in upon screen turn-off was aggressively colliding with native OS features that took the user out of the App tree temporarily.

### The Applied Solution
1. Inspected the `_layout.tsx` hook mapping `current` and `nextState` properties of `AppState`.
2. Located the diff parameter enforcing `< 60000`.
3. Extended the grace period limit to **300000ms (5 minutes)**.

```ts
// _layout.tsx snippet
} else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
    if (hasPin && backgroundTime.current) {
        const elapsed = Date.now() - backgroundTime.current;
        // 5-minute grace period prevents locking when quickly using file pickers/camera
        if (elapsed > 300000) {
            setIsLocked(true);
        }
    }
    backgroundTime.current = null;
}
```

Now, anyone leveraging a File or Media Picker within a React Native locked environment effectively has a solid 5-minute window to fetch their images or files without arbitrarily locking out context!
