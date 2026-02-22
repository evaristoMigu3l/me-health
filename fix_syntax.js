const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/theme=\{\s*calendarBackground/g, 'theme={{ calendarBackground');
    // Also need to find the closing brace of that theme prop and make it double.
    // The previous string was:
    /*
const newTheme = `{
                                calendarBackground: colors.surface, ...
                                indicatorColor: colors.text,
                            }`;
    */
    content = content.replace(/indicatorColor: colors\.text,\s*\}/g, 'indicatorColor: colors.text,\n                            }}');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed syntax in ${filePath}`);
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

walkDir('/home/evaristo/Documents/me&health/app');
