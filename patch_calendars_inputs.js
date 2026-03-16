const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Add color: colors.text to any styles.input that doesn't have it
    content = content.replace(/input:\s*\{([^}]*)\}/g, (match, inner) => {
        if (!inner.includes('color:') && !inner.includes('color :')) {
            return `input: {${inner}, color: colors.text }`;
        }
        return match;
    });

    // 2. Fix Calendar theme prop for react-native-calendars
    const newTheme = `{
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.primary || '#14B8A6',
                                selectedDayTextColor: colors.surface,
                                todayTextColor: colors.primary || '#14B8A6',
                                dayTextColor: colors.text,
                                textDisabledColor: colors.border,
                                dotColor: colors.primary || '#14B8A6',
                                selectedDotColor: colors.surface,
                                arrowColor: colors.text,
                                monthTextColor: colors.text,
                                indicatorColor: colors.text,
                            }`;

    content = content.replace(/theme=\{\{[\s\S]*?\}\}/g, (match) => {
        if (match.includes('todayTextColor')) {
            return `theme=${newTheme}`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Patched ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') && !fullPath.includes('_layout')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'app'));
