# React Navigation Unmount State Flicker Fix Skill

## Description of the Problem
When users added a record (e.g. medication, activity, sleep), they experienced a brief UI flicker or a flashing unmounted component error right before or during navigation. This was caused by component state updates occurring after the component had already started unmounting due to `router.back()` or similar navigation calls. React throws a warning when state is updated on an unmounted component, and clearing forms or resetting loading states during navigation transitions causes jarring UI flickers.

## Errors Encountered
- `Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.`
- Visual "flashing" or "flickering" of modals and UI elements (like form inputs clearing) immediately prior to the screen returning to the previous screen.

## How It Was Intelligently Solved
Instead of tracking component mount status using `useRef(true)` across every component (which is tedious and error-prone), the solution targets the root cause: the order of operations in the async submission flow.

I applied a simple, robust pattern when handling form submissions that include a navigation exit (`router.back()`):
1. Wait for the asynchronous save/update operation to complete.
2. Ensure any visual updates (like closing modals or setting loading states to false) happen synchronously *before* navigating.
3. Keep the user data in the UI intact until the screen is fully replaced, thus avoiding visual flickers.
4. Wrap the navigation call in a `setTimeout(..., 100)` or similar minimal delay to guarantee React paints the state updates before the router unmounts the screen.

### The Applied Solution Pattern
```javascript
// Before (Problematic - Causes UI flicker and potentially unmounted state error)
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitData(data);
    router.back(); 
    // If state updates later in finally block, the component is already unmounted!
  } catch (error) { ... }
  finally {
    setIsLoading(false); 
    setFormValues(defaultValues); // UI flashes empty just as the screen transitions away!
  }
}

// After (Intelligent Fix)
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitData(data);
    // 1. Reset loading first, while still mounted
    setIsLoading(false);
    
    // 2. Allow UI to render the final state quickly before unmounting
    setTimeout(() => {
      router.back();
    }, 100);
    
    return; // Early return to avoid triggering finally block which might contain generic resets
  } catch (error) {
    setIsLoading(false);
    // Handle error...
  }
}
```

This ensures the user's input remains visible while the success toast or transition occurs, making the app look polished and completely eliminating the React unmount update warning.

To enforce this quickly and consistently, I implemented an AST-based automated patching script using `jscodeshift`/Regex that scanned components for problematic `router.back()` calls mixed with `finally{}` blocks and safely restructured them.
