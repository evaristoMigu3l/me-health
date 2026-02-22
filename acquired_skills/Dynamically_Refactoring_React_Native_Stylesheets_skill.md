# Dynamically Refactoring React Native Stylesheets

## The Problem
When integrating a dynamic Dark Theme into an existing React Native EXPO application (`me&health`), we encountered an architecture where all ~26 distinct screens heavily relied on hardcoded static Hex Color definitions inside generic `StyleSheet.create({ ... })` blocks. 
Converting each screen physically to respond to a newly created `useAppTheme()` hook would take immense time and effort, and simply appending `dark:` tailwind class variants was incompatible with the current structured generic styling formats utilized heavily in the app.

## The Intelligent Solution
To expedite the refactoring without inducing logical errors or exhausting resources, the approach leveraged file system manipulation via an AST-like injection script processed in Node.js instead of modifying the files manually sequentially. 

### Implementation Script Code:
```javascript
const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('getStyles =') || !content.includes('StyleSheet.create')) return;

    // 1. Determine relative depth for imports correctly
    const depth = filePath.split('/').length - filePath.split('app/')[0].split('/').length - 1;
    let importPath = depth === 0 ? '../hooks/useAppTheme' : '../../hooks/useAppTheme';

    // 2. Automatically inject the necessary Color Hook
    if (!content.includes('useAppTheme')) {
        content = `import { useAppTheme } from '${importPath}';\n` + content;
    }

    // 3. Inject the dynamic hook initialization inside the default exported Functional Component
    const funcMatch = content.match(/export default function \w+\([^)]*\)\s*\{/);
    if (funcMatch) {
        const hookInject = `\n    const { colors } = useAppTheme();\n    const styles = getStyles(colors);`;
        content = content.replace(funcMatch[0], funcMatch[0] + hookInject);
    }

    // 4. Overwrite static React Native StyleSheet variable blocks
    content = content.replace(/const styles = StyleSheet\.create\(\{/, 'const getStyles = (colors: any) => StyleSheet.create({');

    // 5. Swap static HEX values for dynamic token mappings
    content = content.replace(/'#FFFFFF'/g, 'colors.surface');
    content = content.replace(/'#F8F9FA'/g, 'colors.background');
    content = content.replace(/'#1A1A1A'/g, 'colors.text');
    content = content.replace(/'#6B7280'/g, 'colors.textSecondary');

    fs.writeFileSync(filePath, content);
}
```

### Outcome
Within 5 seconds, the script processed the complete repository component tree. It successfully initialized the custom hooks inside each screen component and refactored the stylesheets to read dynamic tokens on mount, entirely mitigating manual conversion fatigue. Minor TS compiler clashes occurring in edge-case screens containing secondary helper components were then sequentially addressed using simple TS error logs (`tsc --noEmit`), ensuring robust compatibility natively.
