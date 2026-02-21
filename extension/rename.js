const fs = require('fs');
const path = require('path');

const targetDir = '/Users/yashrajsinghyadav/Downloads/sayapply/extension';
const excludeDirs = ['node_modules', 'dist', '.git'];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                processDirectory(fullPath);
            }
        } else {
            // Only process common text files
            if (/\.(js|jsx|json|html|md|css)$/i.test(fullPath)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('Say Apply')) {
                    console.log('Updating:', fullPath);
                    const newContent = content.replace(/Say Apply/g, 'Say Apply');
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                }
            }
        }
    }
}

processDirectory(targetDir);
console.log('Update complete.');
