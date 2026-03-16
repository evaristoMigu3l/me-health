const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(appDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace animationType="slide" and animationType="fade" with animationType="none"
    const regexSlide = /animationType="slide"/g;
    const regexFade = /animationType="fade"/g;

    let modified = false;

    if (regexSlide.test(content)) {
        content = content.replace(regexSlide, 'animationType="none"');
        modified = true;
    }

    if (regexFade.test(content)) {
        content = content.replace(regexFade, 'animationType="none"');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Removed animations in:', path.relative(__dirname, file));
    }
});

console.log(`Patched ${changedCount} files to use animationType="none".`);
