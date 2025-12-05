const fs = require('fs');
const path = require('path');

// Настройки путей
const TALES_DIR = path.join(__dirname, '../public/tales');
const OUTPUT_FILE = path.join(__dirname, '../public/tales-index.json');

console.log('✨ Сканирование сказочного королевства...');

// Проверяем существование папки
if (!fs.existsSync(TALES_DIR)) {
    console.error(`❌ Папка ${TALES_DIR} не найдена! Создайте public/tales`);
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

                // Добавляем сказку в список
                tales.push({
                    id: folderName,
                    ...meta
                });
                console.log(`📖 Найден том: ${meta.title || folderName}`);
            } catch (err) {
                console.error(`⚠️ Ошибка чтения магии в ${folderName}:`, err.message);
            }
        }
    }
});

// Записываем результат в public/tales-index.json
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tales, null, 2));
console.log(`✅ Готово! Всего сказок: ${tales.length}. Индекс записан в public/tales-index.json`);
