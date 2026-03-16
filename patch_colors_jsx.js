const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace JSX prop colors
    content = content.replace(/color="#1A1A1A"/g, 'color={colors.text}');
    content = content.replace(/color="#4B5563"/g, 'color={colors.textSecondary}');
    content = content.replace(/color="#6B7280"/g, 'color={colors.textSecondary}');
    content = content.replace(/color="#9CA3AF"/g, 'color={colors.textSecondary}');
    content = content.replace(/color="#FFFFFF"/g, 'color={colors.surface}');
    content = content.replace(/color="#F8F9FA"/g, 'color={colors.background}');
    content = content.replace(/backgroundColor="#FEE2E2"/g, 'backgroundColor={colors.border}');

    // For single quote within inline objects e.g. { color: '#1A1A1A' }
    // which the first script might have missed if not exactly what it looked for, wait, first script did /'#1A1A1A'/g which gets ALL single quotes. So single quotes are mostly done.

    // 2. Add placeholderTextColor to TextInputs
    // Look for <TextInput ... >. If it doesn't have placeholderTextColor, add it.
    content = content.replace(/<TextInput([\s\S]*?)(\/?)>/g, (match, p1, p2) => {
        if (!match.includes('placeholderTextColor')) {
            return `<TextInput placeholderTextColor={colors.textSecondary}${p1}${p2}>`;
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
