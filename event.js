const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

const API_URL = `http://127.0.0.1:8000/api/events/${eventId}`;

async function fetchEventDetail() {
    if (!eventId) {
        document.getElementById('event-detail-container').innerHTML = '<p class="error-message">Подію не знайдено в параметрах запиту.</p>';
        return;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Помилка завантаження даних події');
        
        const event = await response.json();
        renderEventDetail(event);
    } catch (error) {
        console.error('Помилка:', error);
        document.getElementById('event-detail-container').innerHTML = '<p class="error-message">Не вдалося завантажити деталі події з сервера.</p>';
    }
}

function renderEventDetail(event) {
    const container = document.getElementById('event-detail-container');
    
    const formattedPrice = parseFloat(event.price).toString();
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const categoryName = event.category?.name || event.category || 'Не вказано';
    const artistName = event.artist?.name || event.artist || 'Не вказано';
    const venueName = event.venue?.name || event.venue || 'Не вказано';
    const venueCity = event.venue?.city ? `, м. ${event.venue.city}` : '';

    container.innerHTML = `
        <h1>${event.title}</h1>
        <p class="event-description-large">${event.description}</p>
        <div class="event-info-box">
            <p><strong>📅 Дата та час:</strong> ${formattedDate}</p>
            <p><strong>💰 Вартість квитка:</strong> ${formattedPrice} грн</p>
            <p><strong>🎭 Категорія:</strong> ${categoryName}</p>
            <p><strong>🎤 Артист:</strong> ${artistName}</p>
            <p><strong>📍 Майданчик:</strong> ${venueName}${venueCity}</p>
        </div>

        <div id="cart-msg" style="margin-bottom: 15px; display: none;"></div>

        <div class="event-buttons">
            <label for="ticket-amount" style="color: #cbd5e1; font-size: 14px;">Кількість:</label>
            <input type="number" id="ticket-amount" value="1" min="1" max="999" class="amount-input">
            <button id="add-to-cart-btn" class="buy-ticket-btn">Додати в кошик</button>
            <a href="index.html" class="back-btn">← Назад до каталогу</a>
        </div>
    `;

    document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(event.id));
}

async function addToCart(eventId) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `login.html?next=${currentUrl}`;
        return;
    }

    const amountInput = document.getElementById('ticket-amount');
    const parsedAmount = parseInt(amountInput.value, 10);
    const amount = Number.isNaN(parsedAmount) ? 1 : parsedAmount;
    const btn = document.getElementById('add-to-cart-btn');
    const msgDiv = document.getElementById('cart-msg');

    // Перевіряємо ДО блокування кнопки
    if (amount < 1 || amount > 999) {
        msgDiv.className = 'global-error';
        msgDiv.textContent = 'Кількість квитків має бути від 1 до 999.';
        msgDiv.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Додаємо...';
    msgDiv.style.display = 'none';

    try {
        const response = await apiFetch('http://127.0.0.1:8000/api/cart/', {
            method: 'POST',
            body: JSON.stringify({ event_id: eventId, amount: amount }),
        });

        const data = await response.json();

        if (response.status === 201) {
            msgDiv.className = 'global-success';
            msgDiv.innerHTML = `Квитки додано в кошик! <a href="cart.html" style="color: #4ade80; text-decoration: underline;">Перейти до кошика</a>`;
            msgDiv.style.display = 'block';
        } else {
            msgDiv.className = 'global-error';
            msgDiv.textContent = data.event_id?.[0] || data.amount?.[0] || 'Помилка додавання в кошик';
            msgDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Помилка:', error);
        msgDiv.className = 'global-error';
        msgDiv.textContent = 'Не вдалося з\'єднатися з сервером.';
        msgDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Додати в кошик';
    }
}

fetchEventDetail();