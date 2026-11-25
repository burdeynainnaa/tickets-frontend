const ORDERS_API_URL = 'http://127.0.0.1:8000/api/orders/';

document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html?next=orders.html';
        return;
    }
    fetchOrders();
});

async function fetchOrders() {
    const container = document.getElementById('orders-container');
    const errorDiv = document.getElementById('orders-error');

    try {
        const response = await apiFetch(ORDERS_API_URL, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Помилка завантаження замовлень (статус ${response.status})`);
        }
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('Помилка:', error);
        container.innerHTML = '';
        errorDiv.textContent = 'Не вдалося завантажити історію замовлень. Спробуйте оновити сторінку.';
        errorDiv.style.display = 'block';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = `
            <p style="color: #94a3b8; margin: 20px 0;">У вас ще немає оформлених замовлень.</p>
            <a href="index.html" class="buy-ticket-btn" style="display: inline-block; text-decoration: none;">Перейти до подій</a>
        `;
        return;
    }

    orders.forEach(order => {
        const createdDate = new Date(order.created_at).toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'order-card';

        const header = document.createElement('div');
        header.className = 'order-header';
        header.innerHTML = `
            <strong>Замовлення #${order.id}</strong>
            <span style="color: #94a3b8; font-size: 14px;">📅 ${createdDate}</span>
        `;

        const itemsList = document.createElement('div');
        itemsList.className = 'order-items-list';

        order.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'order-item-row';

            const link = document.createElement('a');
            link.href = `event.html?id=${item.event.id}`;
            link.className = 'event-link';
            link.textContent = item.event.title;

            const subtotal = Number(item.subtotal).toFixed(2);
            const details = document.createElement('span');
            details.style.color = '#cbd5e1';
            details.textContent = ` — ${item.amount} шт. × ${item.price} грн = ${subtotal} грн`;

            row.appendChild(link);
            row.appendChild(details);
            itemsList.appendChild(row);
        });

        const totalFormatted = Number(order.total_price).toFixed(2);
        const footer = document.createElement('div');
        footer.className = 'order-footer';
        footer.innerHTML = `Разом сплачено: <strong style="color: #d8b4fe; font-size: 18px;">${totalFormatted} грн</strong>`;

        card.appendChild(header);
        card.appendChild(itemsList);
        card.appendChild(footer);
        container.appendChild(card);
    });
}