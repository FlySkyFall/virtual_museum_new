// JavaScript для военно-исторического зала

document.addEventListener('DOMContentLoaded', () => {
    const warsContainer = document.getElementById('warsContainer');
    let warsData = [];
    
    // Загружаем данные войн
    async function loadWars() {
        try {
            // Показываем индикатор загрузки
            warsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:white;font-size:24px;">Загрузка...</div>';
            
            const response = await fetch('/military-hall/api/wars');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            warsData = await response.json();
            renderWars(warsData);
        } catch (error) {
            console.error('Ошибка загрузки войн:', error);
            warsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:red;font-size:18px;">Ошибка загрузки данных</div>';
        }
    }
    
    // Функция отображения войн
    function renderWars(wars) {
        // Очищаем контейнер
        warsContainer.innerHTML = '';
        
        // Добавляем кнопки
        wars.forEach((war, index) => {
            const button = createWarButton(war, index);
            warsContainer.appendChild(button);
        });
        
        // Применяем стили для позиций
        applyButtonPositions();
    }
    
    // Функция создания кнопки войны
    function createWarButton(war, index) {
        const button = document.createElement('button');
        button.className = 'war-button';
        button.dataset.warId = war._id;
        button.dataset.warName = war.name;
        button.dataset.position = index;
        
        // Добавляем задержку анимации
        button.style.animationDelay = `${(index + 1) * 0.15}s`;
        
        // Внутренняя структура - только фон, текст уже на изображении
        button.innerHTML = `
            <div class="war-button-bg" style="background-image: url('${war.buttonImagePath}');"></div>
        `;
        
        // Добавляем обработчик клика
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const warId = button.dataset.warId;
            const warName = button.dataset.warName;
            
            createRippleEffect(button, e);
            console.log(`Переход к артефактам войны: ${warName} (ID: ${warId})`);
            showNotification(`Загрузка артефактов "${warName}"...`);
            addLoadingToButton(button);
            
            // Открываем страницу с артефактами в модальном окне или новом окне
            setTimeout(() => {
                window.open(`/military-hall/war/${warId}`, '_blank');
                // Или использовать iframe/модальное окно
            }, 500);
        });
        
        return button;
    }
    
    // Функция для применения позиций кнопок
    function applyButtonPositions() {
        const buttons = document.querySelectorAll('.war-button');
        buttons.forEach((btn, index) => {
            // Добавляем классы для позиционирования
            if (index === 0) {
                btn.classList.add('first-btn');
            } else if (index === buttons.length - 1) {
                btn.classList.add('last-btn');
            }
            
            // Устанавливаем отступы в зависимости от позиции
            btn.style.marginTop = index === 0 ? '20px' : '0';
        });
    }
    
    // Функция создания ripple эффекта
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
    
    // Функция добавления эффекта загрузки
    function addLoadingToButton(button) {
        button.classList.add('loading');
        const bg = button.querySelector('.war-button-bg');
        if (bg) {
            bg.style.filter = 'brightness(0.7) blur(2px)';
        }
        
        setTimeout(() => {
            if (button.classList.contains('loading')) {
                button.classList.remove('loading');
                if (bg) {
                    bg.style.filter = '';
                }
            }
        }, 5000);
    }
    
    // Функция показа уведомления
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
            background: linear-gradient(135deg, #2d6c1e 0%, #4a8c3a 100%);
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
        }, 3000);
    }
    
    // Загружаем войны
    loadWars();
    
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
        
        .war-button.loading {
            opacity: 0.7;
            cursor: wait;
        }
        .war-button.loading .war-button-bg {
            filter: brightness(0.7) blur(2px);
            transition: filter 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});