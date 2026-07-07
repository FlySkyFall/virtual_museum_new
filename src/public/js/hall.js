// JavaScript для зала "Литературное краеведение"

document.addEventListener('DOMContentLoaded', () => {
    // Контейнер с кнопками персоналий
    const personsContainer = document.getElementById('personsContainer');
    
    // Кнопка "Назад" на главную
    const backBtn = document.getElementById('backToMain');
    
    // Обработчик для кнопки "Назад"
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Эффект клика
            createRippleEffect(backBtn, event);
            
            // Показываем уведомление
            showNotification('Возврат на главную страницу...');
            
            // Задержка для эффекта
            setTimeout(() => {
                window.location.href = '/';
            }, 400);
        });
    }
    
    // Загружаем всех персоналий
    loadAllPersons();
    
    // Функция для загрузки всех персоналий
    async function loadAllPersons() {
        try {
            // Показываем индикатор загрузки
            personsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:white;font-size:24px;">Загрузка...</div>';
            
            const response = await fetch('/hall/api/persons');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            const allPersons = await response.json();
            
            // Очищаем контейнер
            personsContainer.innerHTML = '';
            
            // Добавляем все кнопки персоналий
            allPersons.forEach((person, index) => {
                const button = createPersonButton(person, index);
                personsContainer.appendChild(button);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки персоналий:', error);
            personsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:red;font-size:18px;">Ошибка загрузки данных</div>';
        }
    }
    
    // Функция создания кнопки персоналии (без изменений)
    function createPersonButton(person, index) {
        const button = document.createElement('button');
        button.className = 'person-button';
        button.dataset.personId = person._id;
        button.dataset.personName = person.fullName;
        
        // Добавляем задержку анимации
        button.style.animationDelay = `${(index + 1) * 0.1}s`;
        
        // Внутренняя структура
        button.innerHTML = `
            <div class="person-button-bg" style="background-image: url('${person.buttonImagePath || '/images/default-person.png'}');"></div>
            <div class="person-info">
                <div class="person-name">
                    <span class="person-surname">${person.lastName || ''}</span>
                    <span class="person-name-rest">${person.firstName || ''} ${person.patronymic || ''}</span>
                </div>
            </div>
        `;
        
        // Добавляем обработчик клика
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const personId = button.dataset.personId;
            const personName = button.dataset.personName;
            
            createRippleEffect(button, e);
            console.log(`Переход на страницу персоналии: ${personName} (ID: ${personId})`);
            showNotification(`Загрузка страницы "${personName}"...`);
            addLoadingToButton(button);
            
            setTimeout(() => {
                window.location.href = `/hall/person/${personId}`;
            }, 500);
        });
        
        return button;
    }
    
    // Функция создания ripple эффекта (без изменений)
    function createRippleEffect(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
            animation: rippleEffect 0.6s ease-out;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // Функция добавления эффекта загрузки (без изменений)
    function addLoadingToButton(button) {
        const surnameElement = button.querySelector('.person-surname');
        const nameRestElement = button.querySelector('.person-name-rest');
        
        const originalSurname = surnameElement?.textContent || '';
        const originalNameRest = nameRestElement?.textContent || '';
        
        if (surnameElement) surnameElement.textContent = 'Загрузка...';
        if (nameRestElement) nameRestElement.textContent = '';
        
        button.classList.add('loading');
        
        setTimeout(() => {
            if (button.classList.contains('loading')) {
                if (surnameElement) surnameElement.textContent = originalSurname;
                if (nameRestElement) nameRestElement.textContent = originalNameRest;
                button.classList.remove('loading');
            }
        }, 5000);
    }
    
    // Функция показа уведомления (без изменений)
    function showNotification(message) {
        const existingNotification = document.querySelector('.hall-notification');
        if (existingNotification) existingNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = 'hall-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            z-index: 1000;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
            pointer-events: none;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            from { transform: scale(0); opacity: 0.7; }
            to { transform: scale(4); opacity: 0; }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100px); }
        }
        .person-button.loading {
            opacity: 0.8;
            cursor: wait;
            animation: loadingPulse 1s infinite;
        }
        .person-button.loading .person-button-bg {
            filter: blur(2px);
        }
        @keyframes loadingPulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.6; }
        }
    `;
    document.head.appendChild(style);
});