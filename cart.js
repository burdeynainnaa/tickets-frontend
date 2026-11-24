const CART_API_URL = 'http://127.0.0.1:8000/api/cart/';
const ORDERS_API_URL = 'http://127.0.0.1:8000/api/orders/';

document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html?next=cart.html';
        return;
    }
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutOrder);
    }
    fetchCart();
});

async function fetchCart() {
    const container = document.getElementById('cart-container');
    const summaryDiv = document.getElementById('cart-summary');
    const errorDiv = document.getElementById('cart-error');

    try {
        const response = await apiFetch(CART_API_URL, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Помилка завантаження кошика (статус ${response.status})`);
        }

        const items = await response.json();
        renderCart(items);
    } catch (error) {
        console.error('Помилка:', error);
        container.innerHTML = '';
        summaryDiv.style.display = 'none';
        errorDiv.textContent = 'Не вдалося завантажити кошик. Спробуйте оновити сторінку.';
        errorDiv.style.display = 'block';
    }
}

function renderCart(items) {
    const container = document.getElementById('cart-container');
    const summaryDiv = document.getElementById('cart-summary');
    const totalPriceEl = document.getElementById('cart-total-price');

    container.innerHTML = '';

    if (items.length === 0) {
        summaryDiv.style.display = 'none';
        container.innerHTML = `
            <p style="color: #94a3b8; margin: 20px 0;">Ваш кошик порожній.</p>
            <a href="index.html" class="buy-ticket-btn" style="display: inline-block; text-decoration: none;">Перейти до подій</a>
        `;
        return;
    }

    let totalPrice = 0;

    items.forEach(item => {
        const price = parseFloat(item.event.price);
        const itemTotal = Number((price * item.amount).toFixed(2));
        totalPrice = Number((totalPrice + itemTotal).toFixed(2));

        const eventDate = new Date(item.event.date);
        const formattedDate = eventDate.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="cart-item-info">
                <h3><a href="event.html?id=${item.event.id}" class="event-link">${item.event.title}</a></h3>
                <p>📅 ${formattedDate}</p>
                <p>🎫 Кількість: <strong>${item.amount}</strong> × ${price} грн = <strong>${itemTotal} грн</strong></p>
            </div>
            <button class="remove-cart-btn" data-id="${item.id}">Видалити</button>
        `;
        container.appendChild(row);
    });

    totalPriceEl.textContent = `${totalPrice} грн`;
    summaryDiv.style.display = 'block';

    document.querySelectorAll('.remove-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => removeCartItem(btn.dataset.id, btn));
    });
}

async function removeCartItem(itemId, button) {
    const errorDiv = document.getElementById('cart-error');
    const successDiv = document.getElementById('cart-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Видалення...';

    try {
        const response = await apiFetch(`${CART_API_URL}${itemId}/`, {
            method: 'DELETE',
        });

        if (response.status === 204) {
            successDiv.textContent = 'Позицію видалено з кошика.';
            successDiv.style.display = 'block';
            await fetchCart();
        } else {
            throw new Error('Не вдалося видалити позицію');
        }
    } catch (error) {
        console.error('Помилка видалення:', error);
        errorDiv.textContent = 'Не вдалося видалити позицію з кошика.';
        errorDiv.style.display = 'block';
        button.disabled = false;
        button.textContent = 'Видалити';
    }
}

async function checkoutOrder() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const errorDiv = document.getElementById('cart-error');
    const successDiv = document.getElementById('cart-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Оформлення...';

    try {
        const response = await apiFetch(ORDERS_API_URL, { method: 'POST' });
        const data = await response.json();

        if (response.status === 201) {
            successDiv.innerHTML = `Замовлення #${data.id} успішно оформлено! <a href="orders.html" style="color: #4ade80; text-decoration: underline;">Переглянути мої замовлення</a>`;
            successDiv.style.display = 'block';
            await fetchCart();
        } else {
            errorDiv.textContent = data.error || 'Не вдалося оформити замовлення.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Помилка оформлення замовлення:', error);
        errorDiv.textContent = 'Не вдалося з\'єднатися з сервером.';
        errorDiv.style.display = 'block';
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Оформити замовлення';
    }
}