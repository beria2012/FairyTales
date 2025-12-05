import { PageFlip } from 'page-flip';
import Fuse from 'fuse.js';
import './style.css';

let allTales = [];
let pageFlipInstance = null;

// 1. Загрузка данных
async function init() {
    try {
        const response = await fetch('/tales-index.json');
        if (!response.ok) throw new Error('Нет списка сказок');
        allTales = await response.json();
        renderLibrary(allTales);
    } catch (e) {
        console.error("Пока нет сказок или ошибка загрузки", e);
        document.getElementById('books-grid').innerHTML = '<p style="text-align:center; width:100%">Библиотека пока пуста. Добавьте сказки в репозиторий!</p>';
    }
}

// 2. Отрисовка библиотеки
function renderLibrary(tales) {
    const grid = document.getElementById('books-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';
    
    if (tales.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    tales.forEach(tale => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <img src="/tales/${tale.id}/${tale.cover}" alt="${tale.title}">
            <h3>${tale.title}</h3>
            <p>${tale.author}</p>
        `;
        card.onclick = () => openBook(tale);
        grid.appendChild(card);
    });
}

// 3. Поиск
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (!query) {
        renderLibrary(allTales);
        return;
    }
    
    const fuse = new Fuse(allTales, {
        keys: ['title', 'author'],
        threshold: 0.4
    });
    
    const result = fuse.search(query).map(r => r.item);
    renderLibrary(result);
});

// 4. Открытие книги
async function openBook(tale) {
    document.getElementById('library-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');

    // Настройка аудио
    const audioContainer = document.getElementById('audio-player-container');
    const audioPlayer = document.getElementById('audio-player');
    
    if (tale.audio) {
        audioContainer.classList.remove('hidden');
        audioPlayer.src = `/tales/${tale.id}/${tale.audio}`;
    } else {
        audioContainer.classList.add('hidden');
        audioPlayer.pause();
    }

    // Создаем контейнер для страниц
    const bookEl = document.getElementById('flip-book');
    bookEl.innerHTML = ''; // Чистим старое

    // Создаем обложку и страницы
    // Если pages - это массив картинок ['1.jpg', '2.jpg']
    if (Array.isArray(tale.pages)) {
        tale.pages.forEach(pageFile => {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${pageFile}" loading="lazy">`;
            bookEl.appendChild(div);
        });
    } else {
        // Если просто указано количество страниц (предполагаем имена 1.jpg, 2.jpg...)
        for(let i=1; i <= tale.pagesCount; i++) {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${i}.jpg" loading="lazy">`;
            bookEl.appendChild(div);
        }
    }

    // Инициализация библиотеки PageFlip
    pageFlipInstance = new PageFlip(bookEl, {
        width: 400, // базовый размер страницы
        height: 600,
        showCover: true,
        maxShadowOpacity: 0.5
    });

    pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));
}

// 5. Закрытие книги
document.getElementById('close-btn').onclick = () => {
    document.getElementById('reader-view').classList.add('hidden');
    document.getElementById('library-view').classList.remove('hidden');
    
    // Остановить аудио
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.pause();
    
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
};

init();