const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already patched or no StyleSheet
    if (content.includes('getStyles =') || !content.includes('StyleSheet.create')) return;

    // Detect depth for import
    const depth = filePath.split('/').length - filePath.split('app/')[0].split('/').length - 1;
    let importPath = depth === 0 ? '../hooks/useAppTheme' : '../../hooks/useAppTheme';
    if (filePath.includes('app/(tabs)')) {
        importPath = '../../hooks/useAppTheme';
    } else if (filePath.includes('app/')) {
        importPath = '../hooks/useAppTheme';
    }

    // 1. Add import
    if (!content.includes('useAppTheme')) {
        const importMatch = content.match(/import .* from 'react-native';/);
        if (importMatch) {
            content = content.replace(importMatch[0], `${importMatch[0]}\nimport { useAppTheme } from '${importPath}';`);
        } else {
            content = `import { useAppTheme } from '${importPath}';\n` + content;
        }
    }

    // 2. Modify component to use hook Let's find "export default function XXX() {"
    const funcMatch = content.match(/export default function \w+\([^)]*\)\s*\{/);
    if (funcMatch) {
        const hookInject = `\n    const { colors } = useAppTheme();\n    const styles = getStyles(colors);`;
        content = content.replace(funcMatch[0], funcMatch[0] + hookInject);
    }

    // 3. Modify StyleSheet.create
    content = content.replace(/const styles = StyleSheet\.create\(\{/, 'const getStyles = (colors: any) => StyleSheet.create({');

    // 4. Replace colors inside the StyleSheet
    // We only want to replace literal strings with references to `colors.xxx`
    content = content.replace(/'#FFFFFF'/g, 'colors.surface');
    content = content.replace(/'#F8F9FA'/g, 'colors.background');
    content = content.replace(/'#1A1A1A'/g, 'colors.text');
    content = content.replace(/'#6B7280'/g, 'colors.textSecondary');
    content = content.replace(/'#9CA3AF'/g, 'colors.textSecondary');
    content = content.replace(/'#F3F4F6'/g, 'colors.border');
    content = content.replace(/'#E5E7EB'/g, 'colors.border');

    fs.writeFileSync(filePath, content);
    console.log(`Patched ${filePath}`);
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

