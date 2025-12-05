import { PageFlip } from 'page-flip';
import Fuse from 'fuse.js';
import './style.css';

let allTales = [];
let pageFlipInstance = null;

async function init() {
    try {
        const response = await fetch('/tales-index.json');
        if (!response.ok) throw new Error('Data loading error');
        allTales = await response.json();
        renderLibrary(allTales);
    } catch (e) {
        console.error(e);
        document.getElementById('books-grid').innerHTML = '<h2 style="color:gold; text-align:center;">The library is closed for cleaning... (Add tales via Git)</h2>';
    }
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

    tales.forEach(tale => {
        const card = document.createElement('div');
        card.className = 'book-card';
        // Заглушка, если нет обложки
        const coverSrc = tale.cover ? `/tales/${tale.id}/${tale.cover}` : 'https://i.ibb.co/3rL2j9n/vintage-cover-placeholder.jpg';
        
        card.innerHTML = `
            <img src="${coverSrc}" alt="${tale.title}">
            <h3>${tale.title}</h3>
            <p>${tale.author || 'Ancient Legend'}</p>
        `;
        card.onclick = () => openBook(tale);
        grid.appendChild(card);
    });
}

// Поиск
const searchInput = document.getElementById('search-input');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (!query) {
            renderLibrary(allTales);
            return;
        }
        const fuse = new Fuse(allTales, { keys: ['title', 'author'], threshold: 0.4 });
        renderLibrary(fuse.search(query).map(r => r.item));
    });
}

async function openBook(tale) {
    document.getElementById('library-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');

    const audioBar = document.getElementById('audio-bar');
    const audioPlayer = document.getElementById('audio-player');
    
    if (tale.audio) {
        audioBar.classList.remove('hidden');
        audioPlayer.src = `/tales/${tale.id}/${tale.audio}`;
    } else {
        audioBar.classList.add('hidden');
        audioPlayer.pause();
    }

    const bookEl = document.getElementById('flip-book');
    bookEl.innerHTML = ''; 

    // Добавляем страницы
    if (Array.isArray(tale.pages)) {
        tale.pages.forEach(page => {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${page}" loading="lazy">`;
            bookEl.appendChild(div);
        });
    } else {
        const count = tale.pages || 5;
        for(let i=1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${i}.jpg" loading="lazy" onerror="this.style.display='none'">`;
            bookEl.appendChild(div);
        }
    }

    // Инициализация книги
    pageFlipInstance = new PageFlip(bookEl, {
        width: 400,
        height: 600,
        size: 'fixed',
        drawShadow: true,
        maxShadowOpacity: 0.3,
        showCover: false,
        usePortrait: false 
    });

    pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));
}

const closeBtn = document.getElementById('close-btn');
if(closeBtn) {
    closeBtn.onclick = () => {
        document.getElementById('reader-view').classList.add('hidden');
        document.getElementById('library-view').classList.remove('hidden');
        document.getElementById('audio-player').pause();
        if (pageFlipInstance) pageFlipInstance.destroy();
    };
}

init();
