const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Add innerCircleColor to PieChart
    content = content.replace(/<PieChart([\s\S]*?)(\/?>)/g, (match, p1, p2) => {
        if (!match.includes('innerCircleColor')) {
            return `<PieChart innerCircleColor={colors.surface}${p1}${p2}`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Patched PieChart in ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

walkDir('/home/evaristo/Documents/me&health/app');
