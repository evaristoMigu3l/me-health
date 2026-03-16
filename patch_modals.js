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

    // find all <Modal that don't have statusBarTranslucent and hardwareAccelerated
    // we'll replace <Modal with <Modal statusBarTranslucent hardwareAccelerated
    // but only if it doesn't already have statusBarTranslucent
    const regex = /<Modal(?![^>]*statusBarTranslucent)(\s|>)/g;

    if (regex.test(content)) {
        const newContent = content.replace(regex, '<Modal statusBarTranslucent hardwareAccelerated$1');
        fs.writeFileSync(file, newContent, 'utf8');
        changedCount++;
        console.log('Patched modal in:', path.relative(__dirname, file));
    }
});

console.log(`Patched ${changedCount} files with anti-flicker Modal props.`);
