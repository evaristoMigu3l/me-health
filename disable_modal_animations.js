const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'app'),
    path.join(__dirname, 'components')
];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

let files = [];
dirs.forEach(dir => {
    files = files.concat(walk(dir));
});

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace animationType="..." or animationType={'...'} with animationType="none"
    // Also cover animationType={"..."}
    const regex1 = /animationType="[^"]+"/g;
    const regex2 = /animationType=\{["'][^"']+["']\}/g;

    let modified = false;

    if (regex1.test(content)) {
        content = content.replace(regex1, 'animationType="none"');
        modified = true;
    }

    if (regex2.test(content)) {
        content = content.replace(regex2, 'animationType="none"');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Removed animations in:', path.relative(__dirname, file));
    }
});

console.log(`Patched ${changedCount} files to use animationType="none".`);
