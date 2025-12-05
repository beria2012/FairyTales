import { PageFlip } from 'page-flip';
import Fuse from 'fuse.js';
import '../style.css'; // Импорт стилей, если используется Vite/Webpack

let allTales = [];
let pageFlipInstance = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    init();
    initCursor();
});

async function init() {
    try {
        // Попытка загрузить данные. 
        // Если файла нет, используем демо-данные для примера.
        let data;
        try {
            const response = await fetch('/tales-index.json');
            if (!response.ok) throw new Error('No index file');
            data = await response.json();
        } catch (e) {
            console.warn('Loading demo tales because tales-index.json was not found.');
            data = getDemoTales();
        }

        allTales = data;
        renderLibrary(allTales);
        setupSearch();
    } catch (e) {
        console.error("Critical error:", e);
        document.getElementById('books-grid').innerHTML = 
            '<h2 style="color:gold; text-align:center; grid-column: 1/-1;">The magic scrolls are hidden... (Check console)</h2>';
    }
}

// Демо-данные на случай отсутствия JSON
function getDemoTales() {
    return [
        { id: 'cinderella', title: 'Cinderella', author: 'Charles Perrault', cover: '', pages: 4 },
        { id: 'red-hood', title: 'Red Riding Hood', author: 'Brothers Grimm', cover: '', pages: 6 },
        { id: 'puss-boots', title: 'Puss in Boots', author: 'Charles Perrault', cover: '', pages: 5 },
        { id: 'snow-white', title: 'Snow White', author: 'Brothers Grimm', cover: '', pages: 5 },
        { id: 'mermaid', title: 'The Little Mermaid', author: 'H.C. Andersen', cover: '', pages: 4 }
    ];
}

function renderLibrary(tales) {
    const grid = document.getElementById('books-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';
    
    if (!tales || tales.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    tales.forEach((tale, index) => {
        // Генерация случайного цвета для обложки
        const colors = ['#8a1c1c', '#1c3b8a', '#1c8a45', '#4a1c8a', '#5d4037'];
        const randomColor = colors[index % colors.length];

        const card = document.createElement('div');
        card.className = 'book-card';
        
        // Если есть обложка - ставим картинку, иначе цвет
        // Предполагается структура папок /tales/{id}/cover.jpg
        const coverStyle = tale.cover 
            ? `background-image: url('/tales/${tale.id}/${tale.cover}')`
            : `background-color: ${randomColor}`;

        // HTML структура 3D книги
        card.innerHTML = `
            <div class="book-cover" style="${coverStyle}">
                <div class="book-info">
                    <h3>${tale.title}</h3>
                    <p>${tale.author || 'Ancient Legend'}</p>
                </div>
            </div>
            <div class="pages-edge"></div>
        `;
        
        // Каскадная анимация появления (float)
        card.style.animation = `float 6s ease-in-out ${index * 0.3}s infinite`;
        
        card.onclick = () => openBook(tale);
        grid.appendChild(card);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if(!searchInput) return;

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
        
        const results = fuse.search(query).map(r => r.item);
        renderLibrary(results);
    });
}

async function openBook(tale) {
    // Переключение интерфейса
    document.getElementById('library-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');

    // Настройка аудио
    const audioBar = document.getElementById('audio-bar');
    const audioPlayer = document.getElementById('audio-player');
    
    if (tale.audio) {
        audioBar.classList.remove('hidden');
        audioPlayer.src = `/tales/${tale.id}/${tale.audio}`;
    } else {
        audioBar.classList.add('hidden');
        audioPlayer.pause();
    }

    // Подготовка контейнера книги
    const bookEl = document.getElementById('flip-book');
    // Очистка предыдущего экземпляра
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    bookEl.innerHTML = ''; 

    // Генерация страниц
    // Предполагаем, что страницы лежат как 1.jpg, 2.jpg и т.д.
    const pagesCount = tale.pages || 4; // Количество страниц из JSON или дефолт
    
    // Создаем страницы
    for(let i=1; i <= pagesCount; i++) {
        const div = document.createElement('div');
        div.className = 'page';
        
        // Можно добавить логику: четные страницы - текст, нечетные - картинки,
        // или просто картинки на всю страницу. Здесь сделаем картинки.
        
        // Для демо используем заглушку, если картинки не грузятся
        const imgPath = `/tales/${tale.id}/${i}.jpg`;
        
        div.innerHTML = `
            <img src="${imgPath}" class="page-image" 
                 onerror="this.src='https://via.placeholder.com/400x600/f4e4bc/3e2723?text=Page+${i}'" 
                 alt="Page ${i}" loading="lazy">
            <div class="page-number">- ${i} -</div>
        `;
        bookEl.appendChild(div);
    }

    // Инициализация библиотеки page-flip
    // Настройки размеров подбираются под дизайн
    pageFlipInstance = new PageFlip(bookEl, {
        width: 400,
        height: 600,
        size: 'fixed',
        drawShadow: true,
        maxShadowOpacity: 0.2,
        showCover: true,
        usePortrait: true, // Одна страница на мобильных
        startPage: 0
    });

    pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));
}

// Логика кнопки закрытия
const closeBtn = document.getElementById('close-btn');
if(closeBtn) {
    closeBtn.onclick = () => {
        document.getElementById('reader-view').classList.add('hidden');
        document.getElementById('library-view').classList.remove('hidden');
        
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        if (pageFlipInstance) {
            pageFlipInstance.destroy();
            pageFlipInstance = null;
        }
    };
}

// --- Логика магического курсора ---
function initCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    // Проверка на touch устройства (там кастомный курсор не нужен)
    if (window.matchMedia("(pointer: coarse)").matches) {
        cursorDot.style.display = 'none';
        cursorOutline.style.display = 'none';
        document.body.style.cursor = 'auto';
        return;
    }

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Точка перемещается мгновенно
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Круг (аура) следует с плавной анимацией
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Реакция на клик
    window.addEventListener('mousedown', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(0.8)';
        cursorOutline.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
    });

    window.addEventListener('mouseup', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.backgroundColor = 'transparent';
    });
}
