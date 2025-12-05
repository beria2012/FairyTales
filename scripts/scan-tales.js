const fs = require('fs');
const path = require('path');

const talesDir = path.join(__dirname, '../public/tales');
const outputFile = path.join(__dirname, '../public/tales-index.json');

// Проверяем, существует ли папка
if (!fs.existsSync(talesDir)) {
    fs.mkdirSync(talesDir, { recursive: true });
}

const tales = [];
const items = fs.readdirSync(talesDir);

items.forEach(item => {
    const itemPath = path.join(talesDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
        // Ищем файл meta.json внутри папки сказки
        const metaPath = path.join(itemPath, 'meta.json');
        
        if (fs.existsSync(metaPath)) {
            try {
                const metaContent = fs.readFileSync(metaPath, 'utf-8');
                const meta = JSON.parse(metaContent);
                
                // Добавляем путь к папке (id = название папки)
                tales.push({
                    id: item,
                    ...meta
                });
                console.log(`✅ Найдена сказка: ${meta.title}`);
            } catch (err) {
                console.error(`❌ Ошибка чтения JSON в папке ${item}:`, err);
            }
        }
    }
});

// Сохраняем общий список
fs.writeFileSync(outputFile, JSON.stringify(tales, null, 2));
console.log(`🎉 Список сказок обновлен! Всего: ${tales.length}`);