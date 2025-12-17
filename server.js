const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Указываем, что файлы сайта лежат в папке public
app.use(express.static('public'));

// API: Магический запрос, который возвращает список сказок
app.get('/api/tales', (req, res) => {
    const talesDir = path.join(__dirname, 'public', 'tales');
    
    // Проверяем, существует ли папка
    if (!fs.existsSync(talesDir)) {
        return res.json([]);
    }

    const tales = [];
    const items = fs.readdirSync(talesDir, { withFileTypes: true });

    // Пробегаемся по каждой папке внутри 'tales'
    items.forEach(item => {
        if (item.isDirectory()) {
            const folderName = item.name;
            const metaPath = path.join(talesDir, folderName, 'meta.json');

            // Если внутри есть meta.json, читаем его
            if (fs.existsSync(metaPath)) {
                try {
                    const metaContent = fs.readFileSync(metaPath, 'utf-8');
                    const meta = JSON.parse(metaContent);
                    
                    // Добавляем ID (имя папки) для путей
                    tales.push({
                        id: folderName, 
                        ...meta 
                    });
                } catch (err) {
                    console.error(`Ошибка в сказке ${folderName}:`, err);
                }
            }
        }
    });

    res.json(tales);
});

app.listen(PORT, () => {
    console.log(`🏰 Библиотека открыта: http://localhost:${PORT}`);
    console.log(`Положите сказки в папку public/tales/ и обновите страницу.`);
});
