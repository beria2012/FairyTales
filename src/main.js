import { PageFlip } from 'page-flip';
import Fuse from 'fuse.js';
import './style.css';

let allTales = [];
let pageFlipInstance = null;

// 1. Fetch Data
async function init() {
    try {
        const response = await fetch('/tales-index.json');
        if (!response.ok) throw new Error('No tales index found');
        allTales = await response.json();
        renderLibrary(allTales);
    } catch (e) {
        console.error("Loading error:", e);
        // Fallback for empty state
        document.getElementById('books-grid').innerHTML = '<p style="color:#aaa; width:100%; text-align:center;">Library is being built... Check back soon!</p>';
    }
}

// 2. Render Grid
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
        // Check if cover exists, else use placeholder
        const coverSrc = tale.cover ? `/tales/${tale.id}/${tale.cover}` : 'https://via.placeholder.com/200x300?text=No+Cover';
        
        card.innerHTML = `
            <img src="${coverSrc}" alt="${tale.title}">
            <h3>${tale.title}</h3>
            <p>${tale.author || 'Unknown Author'}</p>
        `;
        card.onclick = () => openBook(tale);
        grid.appendChild(card);
    });
}

// 3. Search
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

// 4. Open Book (Reader Mode)
async function openBook(tale) {
    document.getElementById('library-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');

    // Audio Setup
    const audioBar = document.getElementById('audio-bar');
    const audioPlayer = document.getElementById('audio-player');
    
    if (tale.audio) {
        audioBar.classList.remove('hidden');
        audioPlayer.src = `/tales/${tale.id}/${tale.audio}`;
    } else {
        audioBar.classList.add('hidden');
        audioPlayer.pause();
    }

    // Prepare Pages
    const bookEl = document.getElementById('flip-book');
    bookEl.innerHTML = ''; 

    // Add Cover (First Page)
    if(tale.cover) {
         const coverDiv = document.createElement('div');
         coverDiv.className = 'page';
         coverDiv.innerHTML = `<img src="/tales/${tale.id}/${tale.cover}" style="object-fit:cover; width:100%; height:100%;">`;
         bookEl.appendChild(coverDiv);
    }

    // Add Content Pages
    if (Array.isArray(tale.pages)) {
        tale.pages.forEach(pageFile => {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${pageFile}" loading="lazy">`;
            bookEl.appendChild(div);
        });
    } else {
        // Fallback if pages count is number
        for(let i=1; i <= (tale.pages || 5); i++) {
            const div = document.createElement('div');
            div.className = 'page';
            div.innerHTML = `<img src="/tales/${tale.id}/${i}.jpg" loading="lazy" onerror="this.style.display='none'">`;
            bookEl.appendChild(div);
        }
    }

    // Init PageFlip
    // РАЗМЕРЫ ВАЖНЫ: подгоняем под вашу картинку
    pageFlipInstance = new PageFlip(bookEl, {
        width: 440,   // Ширина одной страницы
        height: 640,  // Высота страницы
        size: 'fixed',
        showCover: false, // Обложку делаем просто как страницу
        maxShadowOpacity: 0.2 // Тень не слишком темная
    });

    pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));
}

// 5. Close Book
document.getElementById('close-btn').onclick = () => {
    document.getElementById('reader-view').classList.add('hidden');
    document.getElementById('library-view').classList.remove('hidden');
    
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.pause();
    
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
};

init();
