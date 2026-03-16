const fs = require('fs');
const path = require('path');

const logFiles = [
    'medication-log.tsx',
    'nutrition-log.tsx',
    'mood-log.tsx',
    'measurement-log.tsx',
    'sleep-log.tsx',
    'diagnosis-log.tsx',
    'symptoms-log.tsx',
    'activity-log.tsx'
];

logFiles.forEach(filename => {
    const file = path.join(__dirname, 'app', filename);
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Finding the exact state variable name for the selected item
    const stateMatch = content.match(/const \[selected([A-Za-z]+), setSelected\1\] = useState/);
    if (!stateMatch) {
        console.log(`Could not find state variable in ${filename}`);
        return;
    }

    const typeSuffix = stateMatch[1];
    const upperFunc = `setSelected${typeSuffix}`;
    const selectedVar = `selected${typeSuffix}`;
    const isVisibleVar = `is${typeSuffix}ModalVisible`;
    const setVisibleFunc = `setIs${typeSuffix}ModalVisible`;

    // 1. Add the boolean visibility state right after the selected state
    if (!content.includes(isVisibleVar)) {
        content = content.replace(
            new RegExp(`(const \\[${selectedVar}, ${upperFunc}\\] = useState.*?;)`),
            `$1\n    const [${isVisibleVar}, ${setVisibleFunc}] = useState(false);`
        );
    }

    // 2. Change opening the modal to also set visibility
    // Look for onPress={() => setSelected*(item)} pattern
    // e.g. onPress={() => setSelectedMedication(m)}
    const openRegex = new RegExp(`onPress={[^{]*=>\\s*${upperFunc}\\(([^n][^u][^l][^l][^)]*)\\)}`, 'g');
    content = content.replace(openRegex, (match, param) => {
        return `onPress={() => { ${upperFunc}(${param}); ${setVisibleFunc}(true); }}`;
    });

    // 3. Change closing the modal to ONLY set visibility to false (don't nullify item immediately)
    // Find all setSelected*(null) and change them to setVisible(false)
    const closeRegex = new RegExp(`${upperFunc}\\(null\\)`, 'g');
    content = content.replace(closeRegex, `${setVisibleFunc}(false)`);

    // 4. Update the Modal's visible prop
    // visible={!!selected...} -> visible={isVisibleVar}
    const visibleRegex = new RegExp(`visible=\\{\\!\\!${selectedVar}\\}`, 'g');
    content = content.replace(visibleRegex, `visible={${isVisibleVar}}`);

    // 5. (Optional but good) For the "Edit" route push, we need to close the modal
    // In some places it was `if (selectedX?.id === id) setSelectedX(null)` inside the delete function.
    // Let's fix that if it got broken by the global replace.
    // The previous replace turned `if (selectedX?.id === ...) setVisible(false)` which is actually EXACTLY what we want!

    // Wait, the detail rendering might be conditional like `{selectedVar && (`
    // If it's null it might crash, but we are no longer setting it to null!
    // So the item stays in state until the user picks a different one. 
    // This prevents the flicker during the slide-down animation entirely.

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched ${filename} correctly for unmount flicker.`);
});
