# Building Generic Edit Log Screens with React Native and Zustand

## The Problem
When building an app that relies heavily on logging recurring data entries (e.g., Symptoms, Medications, Nutrition, etc.), developers often build separate "Add" and "Edit" screens. This leads to heavy code duplication and makes future schema changes tedious and error-prone because forms must be updated in multiple places. 

## The Solution
Instead of creating separate screens, one unified `add-*.tsx` screen can be used for both creating and modifying records using URL parameters passed via the Expo Router, and a single global Zustand store can manage the state uniformly. 

Here is what was done to execute this intelligently while refactoring existing code without breaking functionality:

### 1. Unified Form State with `useEffect`
Use Expo Router's `useLocalSearchParams` to grab a unique `id` passed when an "Edit" button is pressed. 
By listening to this `id`, a `useEffect` hook can query the zustand store (e.g., `useHealthStore`) to see if an item already exists. If it does, we inject its values into the local React state hooks of the form, seamlessly converting the blank "Add" form into a fully pre-filled "Edit" form.

```typescript
const { id } = useLocalSearchParams<{ id: string }>();
const { addLog, updateLog, logs } = useHealthStore();

useEffect(() => {
    if (id) {
        const existing = logs.find(item => item.id === id);
        if (existing) {
            setFieldOne(existing.fieldOne);
            setFieldTwo(existing.fieldTwo);
            // ... inject other existing properties
        }
    }
}, [id, logs]);
```

### 2. Intelligent Submission Handlers
The submission handler now acts as a conditional switch. It creates a `data` object holding the exact same schema. 
If the `id` param exists, it knows to route the submission to an `updateAction(data)`. If no `id` exists, it routes to `addAction(data)`.
This single branching path saves duplicating the data validation and creation object shapes.

```typescript
const handleSubmit = () => {
    // Shared Validation
    if (!fieldOne.trim()) return;

    // Shared Payload Object
    const payload = {
        id: id || Date.now().toString(), // Inherit existing ID or create a new one
        fieldOne,
        fieldTwo,
    };

    if (id) {
        updateLog(payload);
    } else {
        addLog(payload);
    }
    router.back();
};
```

### 3. Dynamic UI Affordances
To avoid confusing the end user, small ternary operators across the UI can swap out text depending on the mode the screen is in.

```tsx
<Text style={styles.headerTitle}>{id ? 'Edit Log' : 'Add Log'}</Text>
// ...
<Text style={styles.buttonText}>{id ? 'Update' : 'Save'}</Text>
```

### 4. Updating the Log Lists
On the listing screens, an Edit button can simply push the current item's ID into the route parameters.

```tsx
<TouchableOpacity onPress={() => router.push({ pathname: '/add-log', params: { id: item.id } })}>
    <Text>Edit</Text>
</TouchableOpacity>
```

### 5. Widening Types for Custom Inputs
Often, categories defined tightly in TypeScript (e.g., `'Tablet' | 'Liquid'`) break when users need to type a custom value not anticipated. By widening the type to `'Tablet' | 'Liquid' | string`, the application keeps the developer's hinting and auto-complete while allowing the `<TextInput>` manual overrides to process correctly without throwing TSC compilation errors.

### Conclusion
By unifying the add/edit states, making intelligent use of hooks, and gracefully widening type-checking for custom overrides, you immediately drop feature development time and eliminate nearly half the component files needed to manage health log models!
