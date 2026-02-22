// ==================== Инициализация карты ====================
// Центр карты (Казань)
const map = L.map('map').setView([55.79, 49.12], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ==================== Данные ламп ====================
const lamps = [
    { id: 'KZN-CENTRAL-085', status: 'burnt_out', temp: 42.5, lat: 55.79, lng: 49.12, address: 'ул. Баумана, 15' },
    { id: 'KZN-CENTRAL-086', status: 'working', temp: 38.2, lat: 55.80, lng: 49.13, address: 'ул. Кремлёвская, 10' },
    { id: 'KZN-CENTRAL-087', status: 'replace', temp: 41.0, lat: 55.81, lng: 49.14, address: 'ул. Пушкина, 22' },
    { id: 'KZN-CENTRAL-088', status: 'working', temp: 37.1, lat: 55.78, lng: 49.10, address: 'ул. Гоголя, 5' },
    { id: 'KZN-CENTRAL-089', status: 'burnt_out', temp: 43.0, lat: 55.82, lng: 49.15, address: 'ул. Горького, 7' },
];

// ==================== Функция получения цвета маркера по статусу ====================
function getMarkerColor(status) {
    switch(status) {
        case 'working': return '#4caf50';
        case 'burnt_out': return '#9e9e9e';
        case 'replace': return '#ff9800';
        default: return '#2196f3';
    }
}

// ==================== Создание маркеров ====================
const markers = {};
lamps.forEach(lamp => {
    const marker = L.circleMarker([lamp.lat, lamp.lng], {
        radius: 10,
        color: getMarkerColor(lamp.status),
        fillColor: getMarkerColor(lamp.status),
        fillOpacity: 0.8,
        weight: 2
    }).addTo(map);
    
    // Всплывающая подсказка
    marker.bindPopup(`<b>${lamp.id}</b><br>Статус: ${lamp.status}<br>Температура: ${lamp.temp}°C`);
    
    // Клик по маркеру открывает модальное окно
    marker.on('click', () => showLampDetails(lamp.id));
    
    markers[lamp.id] = marker;
});

// ==================== Обновление статистики ====================
function updateStats() {
    const total = lamps.length;
    const working = lamps.filter(l => l.status === 'working').length;
    const burnt = lamps.filter(l => l.status === 'burnt_out').length;
    const replace = lamps.filter(l => l.status === 'replace').length;

    document.getElementById('stat-on').innerText = working;
    document.getElementById('stat-off').innerText = burnt;
    document.getElementById('stat-replace').innerText = replace;
    document.getElementById('total-lamps').innerText = total;
    document.getElementById('active-lamps').innerText = working;
    document.getElementById('in-progress').innerText = replace; // для примера
}

updateStats();

// ==================== Список ламп, требующих замены (вкладка План) ====================
function renderReplaceList() {
    const replaceList = document.getElementById('replace-list');
    const needReplace = lamps.filter(l => l.status === 'replace' || l.status === 'burnt_out');
    
    replaceList.innerHTML = needReplace.map(l => `
        <div class="lamp-item ${l.status === 'burnt_out' ? 'off' : 'replace'}" data-id="${l.id}">
            <span class="status-indicator"></span>
            <div class="lamp-info">
                <div class="lamp-title">Лампа ${l.id}</div>
                <div class="lamp-address">${l.address}</div>
            </div>
            <div class="lamp-actions">
                <input type="checkbox" class="select-lamp" data-id="${l.id}">
                <button onclick="selectLamp('${l.id}')"><i class="fas fa-edit"></i></button>
            </div>
        </div>
    `).join('');
}

renderReplaceList();

// ==================== Функция отображения деталей лампы ====================
window.selectLamp = function(id) {
    const lamp = lamps.find(l => l.id === id);
    document.getElementById('modal-title').innerText = `Лампа ${id}`;
    document.getElementById('modal-body').innerHTML = `
        <p><strong>Статус:</strong> ${lamp.status}</p>
        <p><strong>Температура:</strong> ${lamp.temp}°C</p>
        <p><strong>Координаты:</strong> ${lamp.lat}, ${lamp.lng}</p>
        <p><strong>Адрес:</strong> ${lamp.address}</p>
        <p><strong>Последнее обслуживание:</strong> 2026-02-20</p>
    `;
    document.getElementById('lamp-modal').style.display = 'block';
};

// Закрытие модалки
document.querySelector('.close').onclick = function() {
    document.getElementById('lamp-modal').style.display = 'none';
};

// ==================== Планирование замены ====================
let plannedLamps = []; // массив id ламп, выбранных для плана

// Обработчик чекбоксов в списке замены
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-lamp')) {
        const lampId = e.target.dataset.id;
        if (e.target.checked) {
            if (!plannedLamps.includes(lampId)) plannedLamps.push(lampId);
        } else {
            plannedLamps = plannedLamps.filter(id => id !== lampId);
        }
    }
});

// Кнопка "Создать план"
document.getElementById('create-plan').addEventListener('click', () => {
    if (plannedLamps.length === 0) {
        alert('Выберите хотя бы одну лампу для замены');
        return;
    }
    
    // Добавляем в раздел "Активные планы"
    const plansList = document.getElementById('active-plans');
    const planId = 'PLAN-' + Date.now();
    const planHtml = `
        <div class="plan-card" data-plan="${planId}">
            <div class="plan-header">
                <span>${planId}</span>
                <span>${plannedLamps.length} ламп</span>
            </div>
            <div class="plan-progress">Статус: запланирован</div>
        </div>
    `;
    plansList.insertAdjacentHTML('beforeend', planHtml);
    
    // Добавляем в очередь на замену (вкладка Выполнение)
    const queueList = document.getElementById('queue-list');
    plannedLamps.forEach(lampId => {
        const lamp = lamps.find(l => l.id === lampId);
        if (lamp) {
            queueList.insertAdjacentHTML('beforeend', `
                <div class="queue-item" data-id="${lampId}">
                    <span>${lamp.id}</span>
                    <span class="priority">в очереди</span>
                </div>
            `);
        }
    });
    
    // Очищаем чекбоксы
    document.querySelectorAll('.select-lamp:checked').forEach(cb => cb.checked = false);
    plannedLamps = [];
});

// ==================== Учёт выполнения ====================
// Кнопка "Отметить замену" (для выбранной лампы)
document.getElementById('mark-replaced').addEventListener('click', () => {
    // Для демо возьмём первую лампу из очереди
    const firstQueue = document.querySelector('.queue-item');
    if (!firstQueue) {
        alert('Нет ламп в очереди');
        return;
    }
    const lampId = firstQueue.dataset.id;
    const lamp = lamps.find(l => l.id === lampId);
    if (lamp) {
        lamp.status = 'working';
        // Обновить маркер
        markers[lampId].setStyle({ color: getMarkerColor('working'), fillColor: getMarkerColor('working') });
        // Удалить из очереди
        firstQueue.remove();
        // Обновить список замены (убрать из списка требующих замены)
        renderReplaceList();
        // Обновить статистику
        updateStats();
        alert(`Лампа ${lampId} отмечена как заменённая`);
    }
});

// Кнопка "Проблема" — просто эмуляция
document.getElementById('report-issue').addEventListener('click', () => {
    alert('Проблема зарегистрирована, отправлен сигнал оператору');
});

// Кнопка "Сканировать" — эмуляция сканирования
document.getElementById('scan-area').addEventListener('click', () => {
    alert('Сканирование зоны... (эмуляция)');
    // Можно добавить логику поиска новых ламп
});

// ==================== WebSocket эмуляция ====================
let wsStatus = document.getElementById('ws-status-text');
wsStatus.innerText = 'Подключено (эмуляция)';
document.getElementById('connection-status').innerHTML = '<i class="fas fa-circle" style="color:#4caf50;"></i><span>WebSocket: Онлайн</span>';

// Периодически (раз в 10 секунд) обновляем статус случайной лампы
setInterval(() => {
    const randomIndex = Math.floor(Math.random() * lamps.length);
    const lamp = lamps[randomIndex];
    if (!lamp) return;
    
    // Меняем статус на случайный (кроме рабочего)
    const newStatus = Math.random() > 0.5 ? 'burnt_out' : 'replace';
    if (lamp.status === 'working') {
        lamp.status = newStatus;
    } else {
        lamp.status = 'working'; // иногда чиним
    }
    
    // Обновить маркер
    markers[lamp.id].setStyle({ color: getMarkerColor(lamp.status), fillColor: getMarkerColor(lamp.status) });
    
    // Обновить список требующих замены
    renderReplaceList();
    
    // Обновить статистику
    updateStats();
    
    // Добавить запись в лог WebSocket
    const wsLog = document.getElementById('ws-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = `[${new Date().toLocaleTimeString()}] Лампа ${lamp.id}: статус изменён на ${lamp.status}`;
    wsLog.prepend(entry); // свежее сверху
    if (wsLog.children.length > 10) wsLog.removeChild(wsLog.lastChild);
    
}, 10000);

// ==================== Переключение вкладок (уже есть в старом коде, но оставим) ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});