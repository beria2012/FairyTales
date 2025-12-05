const fs = require('fs');
const path = require('path');

const TALES_DIR = path.join(__dirname, '../public/tales');
const OUTPUT_FILE = path.join(__dirname, '../public/tales-index.json');

console.log('✨ Scanning Fairy Tales Library...');

if (!fs.existsSync(TALES_DIR)) {
    console.error(`❌ Folder ${TALES_DIR} not found! Please create public/tales`);
    process.exit(1);
}

const tales = [];
const items = fs.readdirSync(TALES_DIR, { withFileTypes: true });

items.forEach(item => {
    if (item.isDirectory()) {
        const folderName = item.name;
        const metaPath = path.join(TALES_DIR, folderName, 'meta.json');

        if (fs.existsSync(metaPath)) {
            try {
                const metaContent = fs.readFileSync(metaPath, 'utf-8');
                const meta = JSON.parse(metaContent);

                tales.push({
                    id: folderName,
                    ...meta 
                });
                console.log(`📖 Found book: ${meta.title || folderName}`);
            } catch (err) {
                console.error(`⚠️ Error reading ${folderName}:`, err.message);
            }
        }
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tales, null, 2));
console.log(`✅ Done! Total stories: ${tales.length}. Index saved to public/tales-index.json`);
