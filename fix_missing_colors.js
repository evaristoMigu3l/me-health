const fs = require('fs');
const { execSync } = require('child_process');

const files = [
    'app/settings.tsx',
    'app/sleep-details.tsx',
    'app/sleep-log.tsx',
    'app/symptom-details.tsx',
    'app/symptoms-log.tsx',
    'components/LockScreen.tsx',
    'app/activity-details.tsx',
    'app/activity-log.tsx',
    'app/add-activity.tsx',
    'app/add-appointment.tsx',
    'app/add-diagnosis.tsx',
    'app/add-investigation.tsx',
    'app/add-measurement.tsx',
    'app/add-medication.tsx',
    'app/add-mood.tsx',
    'app/add-nutrition.tsx',
    'app/add-sleep.tsx',
    'app/add-symptom.tsx',
    'app/appointment-log.tsx',
    'app/diagnosis-details.tsx',
    'app/diagnosis-log.tsx',
    'app/exam-details.tsx',
    'app/investigation-log.tsx',
    'app/measurement-details.tsx',
    'app/measurement-log.tsx',
    'app/medication-details.tsx',
    'app/medication-log.tsx',
    'app/mood-details.tsx',
    'app/mood-log.tsx',
    'app/nutrition-details.tsx',
    'app/nutrition-log.tsx',
    'app/settings.tsx',
    'app/sleep-details.tsx',
    'app/sleep-log.tsx',
    'app/symptom-details.tsx',
    'app/symptoms-log.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/profile.tsx',
    'app/(tabs)/track.tsx'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let doc = fs.readFileSync(f, 'utf8');

    // Check if `const { colors } = useAppTheme();` is missing
    if (!doc.includes('const { colors } = useAppTheme();')) {
        // If the import is missing, add it
        if (!doc.includes('import { useAppTheme }')) {
            doc = doc.replace(/(import .*;\n)+/, "$&\nimport { useAppTheme } from '../hooks/useAppTheme';");
        }
        // Add before getStyles
        doc = doc.replace(/(const styles = getStyles\(colors\);)/, 'const { colors } = useAppTheme();\n    $1');
        // Add before insets if getStyles not found or insets is there
        if (doc.includes('const insets = useSafeAreaInsets();') && !doc.includes('const { colors } = useAppTheme();')) {
            doc = doc.replace('const insets = useSafeAreaInsets();', 'const { colors } = useAppTheme();\n    const insets = useSafeAreaInsets();');
        }
    }
    fs.writeFileSync(f, doc);
});
console.log('Fixed missing colors declarations');
