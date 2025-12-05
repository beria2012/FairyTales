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
        // Если обложки нет, ставим заглушку в стиле старой книги
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
document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value;
    if (!query) {
        renderLibrary(allTales);
        return;
    }
    const fuse = new Fuse(allTales, { keys: ['title', 'author'], threshold: 0.4 });
    renderLibrary(fuse.search(query).map(r => r.item));
});

async function openBook(tale) {
    document.getElementById('library-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');

    const audioBar = document.getElementById('audio-bar');
    if (tale.audio) {
        audioBar.classList.remove('hidden');
        document.getElementById('audio-player').src = `/tales/${tale.id}/${tale.audio}`;
    } else {
        audioBar.classList.add('hidden');
        document.getElementById('audio-player').pause();
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
