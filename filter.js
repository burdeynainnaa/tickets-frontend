const API_BASE_URL = 'http://127.0.0.1:8000/api';

const filterForm = document.getElementById('event-filter-form');
const resetBtn = document.getElementById('reset-filters-btn');
const resultsContainer = document.getElementById('filtered-events-container');
const resultsCountEl = document.getElementById('results-count');
const artistSelect = document.getElementById('filter-artist');
const venueSelect = document.getElementById('filter-venue');

async function loadFilterOptions() {
    try {
        const [artistsRes, venuesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/artists/`),
            fetch(`${API_BASE_URL}/venues/`)
        ]);

        if (artistsRes.ok) {
            const artists = await artistsRes.json();
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist.id;
                option.textContent = artist.name;
                artistSelect.appendChild(option);
            });
        }

        if (venuesRes.ok) {
            const venues = await venuesRes.json();
            venues.forEach(venue => {
                const option = document.createElement('option');
                option.value = venue.id;
                option.textContent = venue.city ? `${venue.name} (${venue.city})` : venue.name;
                venueSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.warn('Не вдалося підвантажити списки артистів/майданчиків:', error);
    }
}

function validateFilterRanges(formData) {
    const minPriceRaw = String(formData.get('min_price') || '').trim();
    const maxPriceRaw = String(formData.get('max_price') || '').trim();

    if (minPriceRaw !== '' && maxPriceRaw !== '') {
        const minPrice = Number(minPriceRaw);
        const maxPrice = Number(maxPriceRaw);
        if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice) && minPrice > maxPrice) {
            return 'Мінімальна ціна не може перевищувати максимальну.';
        }
    }

    const dateFromRaw = String(formData.get('date_from') || '').trim();
    const dateToRaw = String(formData.get('date_to') || '').trim();

    if (dateFromRaw !== '' && dateToRaw !== '') {
        const fromTs = new Date(dateFromRaw).getTime();
        const toTs = new Date(dateToRaw).getTime();
        if (!Number.isNaN(fromTs) && !Number.isNaN(toTs) && fromTs > toTs) {
            return 'Початкова дата та час не можуть бути пізнішими за кінцеві.';
        }
    }

    return null;
}

function buildFilterUrl(formData) {
    const params = new URLSearchParams();

    for (const [key, rawValue] of formData.entries()) {
        const value = String(rawValue).trim();
        if (!value) continue;

        if (key === 'date_from' || key === 'date_to') {
            const isoDate = new Date(value).toISOString();
            params.set(key, isoDate);
        } else {
            params.set(key, value);
        }
    }

    const queryString = params.toString();
    return queryString ? `${API_BASE_URL}/events/?${queryString}` : `${API_BASE_URL}/events/`;
}

async function fetchFilteredEvents() {
    const formData = new FormData(filterForm);
    const validationMessage = validateFilterRanges(formData);

    if (validationMessage) {
        resultsCountEl.textContent = 'Перевірте параметри';
        resultsContainer.innerHTML = `<p class="global-error">${validationMessage}</p>`;
        return;
    }

    resultsContainer.innerHTML = '<p>Пошук подій...</p>';

    try {
        const url = buildFilterUrl(formData);
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Помилка фільтрації:', errorData);
            resultsCountEl.textContent = 'Помилка фільтрації';
            resultsContainer.innerHTML = '<p class="global-error">Перевірте коректність параметрів фільтрації.</p>';
            return;
        }

        const events = await response.json();
        renderFilteredEvents(events);
    } catch (error) {
        console.error('Мережева помилка:', error);
        resultsCountEl.textContent = 'Помилка з’єднання';
        resultsContainer.innerHTML = '<p class="global-error">Не вдалося з’єднатися з сервером на http://127.0.0.1:8000.</p>';
    }
}

function renderFilteredEvents(events) {
    resultsContainer.innerHTML = '';
    resultsCountEl.textContent = `Підібрані події (${events.length})`;

    if (!events.length) {
        resultsContainer.innerHTML = '<p>За обраними фільтрами подій не знайдено. Спробуйте змінити критерії.</p>';
        return;
    }

    events.forEach(event => {
        const formattedPrice = parseFloat(event.price).toString();
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const venueText = event.venue?.name
            ? `${event.venue.name}${event.venue.city ? `, м. ${event.venue.city}` : ''}`
            : (event.venue || 'Не вказано');
        const artistText = event.artist?.name || event.artist || 'Не вказано';

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div>
                <h3><a href="event.html?id=${event.id}" class="event-link">${event.title}</a></h3>
                <p>${event.description || ''}</p>
                <p><strong>🎤 Артист:</strong> ${artistText}</p>
                <p><strong>📍 Майданчик:</strong> ${venueText}</p>
                <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                <p><strong>🎟️ Ціна квитка:</strong> ${formattedPrice} грн</p>
            </div>
            <div class="card-footer-action">
                <a href="event.html?id=${event.id}" class="buy-ticket-btn card-btn-link">Обрати квиток</a>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

filterForm.addEventListener('submit', event => {
    event.preventDefault();
    fetchFilteredEvents();
});

resetBtn.addEventListener('click', () => {
    filterForm.reset();
    fetchFilteredEvents();
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadFilterOptions();
    await fetchFilteredEvents();
});