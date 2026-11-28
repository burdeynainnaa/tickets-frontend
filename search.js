const SEARCH_API_BASE = 'http://127.0.0.1:8000/api';

const searchInputEl = document.getElementById('search-page-input');
const searchClearBtn = document.getElementById('search-page-clear');
const resultsHeadingEl = document.getElementById('search-results-heading');
const resultsListEl = document.getElementById('search-results-list');

let searchDebounceTimer = null;
let latestSearchId = 0;

function escapeText(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatEventDate(isoString) {
    const dt = new Date(isoString);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderEventRows(events, query) {
    resultsListEl.innerHTML = '';

    if (!events.length) {
        resultsHeadingEl.textContent = `Результати для «${query}» (0)`;
        resultsListEl.innerHTML = `<p class="search-hint-text">За запитом «${escapeText(query)}» подій не знайдено.</p>`;
        return;
    }

    resultsHeadingEl.textContent = `Підходящі події (${events.length})`;

    events.forEach(ev => {
        const artistName = ev.artist?.name || ev.artist || '';
        const venueName = ev.venue?.name
            ? `${ev.venue.name}${ev.venue.city ? `, м. ${ev.venue.city}` : ''}`
            : (ev.venue || '');
        const dateStr = formatEventDate(ev.date);
        const priceStr = ev.price !== undefined && ev.price !== null
            ? `${parseFloat(ev.price)} грн`
            : '';

        const detailsParts = [
            artistName ? `🎤 ${escapeText(artistName)}` : '',
            venueName ? `📍 ${escapeText(venueName)}` : '',
            dateStr ? `📅 ${escapeText(dateStr)}` : '',
            priceStr ? `🎟️ ${escapeText(priceStr)}` : ''
        ].filter(Boolean);

        const row = document.createElement('a');
        row.href = `event.html?id=${ev.id}`;
        row.className = 'search-result-row';
        row.innerHTML = `
            <div class="search-result-main">
                <span class="search-result-title">${escapeText(ev.title)}</span>
                ${detailsParts.length ? `<span class="search-result-meta">${detailsParts.join(' • ')}</span>` : ''}
            </div>
            <span class="search-result-arrow">→</span>
        `;
        resultsListEl.appendChild(row);
    });
}

async function performLiveEventSearch(rawQuery) {
    const query = rawQuery.trim();

    if (!query) {
        resultsHeadingEl.textContent = 'Введіть назву події або артиста';
        resultsListEl.innerHTML = '<p class="search-hint-text">Підходящі події з’являться тут окремим списком у міру введення тексту.</p>';
        return;
    }

    const requestId = ++latestSearchId;
    resultsHeadingEl.textContent = 'Пошук...';
    resultsListEl.innerHTML = '<p class="search-hint-text">Шукаємо події в базі...</p>';

    try {
        const encoded = encodeURIComponent(query);
        const [byTitleRes, byArtistRes] = await Promise.all([
            fetch(`${SEARCH_API_BASE}/events/?title=${encoded}`),
            fetch(`${SEARCH_API_BASE}/events/?artist_name=${encoded}`)
        ]);

        if (requestId !== latestSearchId) return;

        const byTitle = byTitleRes.ok ? await byTitleRes.json() : [];
        const byArtist = byArtistRes.ok ? await byArtistRes.json() : [];

        const uniqueMap = new Map();
        [...byTitle, ...byArtist].forEach(item => {
            if (item && item.id !== undefined) {
                uniqueMap.set(item.id, item);
            }
        });

        renderEventRows(Array.from(uniqueMap.values()), query);
    } catch (err) {
        if (requestId !== latestSearchId) return;
        console.error('Помилка пошуку подій:', err);
        resultsHeadingEl.textContent = 'Помилка з’єднання';
        resultsListEl.innerHTML = '<p class="global-error">Не вдалося отримати дані з сервера (http://127.0.0.1:8000).</p>';
    }
}

if (searchInputEl) {
    searchInputEl.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        const value = searchInputEl.value;
        searchDebounceTimer = setTimeout(() => {
            performLiveEventSearch(value);
        }, 200);
    });
}

if (searchClearBtn && searchInputEl) {
    searchClearBtn.addEventListener('click', () => {
        searchInputEl.value = '';
        searchInputEl.focus();
        performLiveEventSearch('');
    });
}