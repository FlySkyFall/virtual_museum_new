// Функция для установки правильной высоты с учётом интерфейса браузера
function setCorrectViewportHeight() {
    // Получаем реальную доступную высоту окна
    const viewportHeight = window.innerHeight;
    
    // Находим контейнер и фон
    const museumContainer = document.querySelector('.museum-container');
    const museumBackground = document.querySelector('.museum-background');
    
    if (museumContainer) {
        museumContainer.style.height = viewportHeight + 'px';
        console.log(`Установлена высота контейнера: ${viewportHeight}px`);
    }
    
    if (museumBackground) {
        museumBackground.style.height = viewportHeight + 'px';
        console.log(`Установлена высота фона: ${viewportHeight}px`);
    }
}

// Функция для обработки изменения размера окна (с debounce для производительности)
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setCorrectViewportHeight();
    }, 100);
}

// Запускаем установку высоты при загрузке страницы
// Это нужно сделать ДО того, как DOMContentLoaded сработает, или внутри него
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setCorrectViewportHeight();
    });
} else {
    // DOM уже загружен
    setCorrectViewportHeight();
}

// Слушаем изменение размера окна
window.addEventListener('resize', handleResize);

// Дополнительно: слушаем изменения ориентации экрана (для мобильных устройств)
window.addEventListener('orientationchange', () => {
    setTimeout(setCorrectViewportHeight, 50);
});

// Ожидаем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Находим все кнопки залов
    const hallButtons = document.querySelectorAll('.hall-button');
    
    console.log(`Найдено ${hallButtons.length} залов музея`);
    
    // Добавляем обработчики событий для каждой кнопки
    hallButtons.forEach((button, index) => {
        // Обработчик клика
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const hallId = button.dataset.hallId;
            const hallRoute = button.dataset.hallRoute;
            
            // Создаем эффект вспышки при клике
            createFlashEffect(button);
            
            // Логируем переход
            console.log(`Переход в зал с ID: ${hallId}, маршрут: ${hallRoute}`);
            
            // Показываем уведомление
            showNotification(`Загрузка зала...`);
            
            // Эффект загрузки на кнопке
            addLoadingEffect(button);
            
            // Выполняем переход по маршруту из data-атрибута
            setTimeout(() => {
                if (hallRoute) {
                    window.location.href = hallRoute;
                } else {
                    // Fallback для старых кнопок
                    window.location.href = `/hall/${hallId}`;
                }
            }, 500);
        });
        
        // Добавляем эффект при наведении
        button.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                button.style.transform = `scale(1.05) translateY(-5px)`;
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = `scale(1) translateY(0)`;
        });
    });
    
    // Функция создания эффекта вспышки
    function createFlashEffect(element) {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        flash.style.borderRadius = '0 0 30px 0';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '10';
        flash.style.animation = 'flashFade 0.4s ease-out';
        
        element.style.position = 'relative';
        element.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 400);
    }
    
    // Функция добавления эффекта загрузки
    function addLoadingEffect(button) {
        // Добавляем класс загрузки
        button.classList.add('loading');
        
        // Создаем анимацию загрузки
        const loader = document.createElement('div');
        loader.className = 'button-loader';
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            z-index: 20;
            pointer-events: none;
        `;
        
        button.appendChild(loader);
        
        // Убираем loader через 5 секунд (если переход не произошел)
        setTimeout(() => {
            if (button.classList.contains('loading')) {
                const existingLoader = button.querySelector('.button-loader');
                if (existingLoader) existingLoader.remove();
                button.classList.remove('loading');
            }
        }, 5000);
    }
    
    // Функция показа уведомления
    function showNotification(message) {
        // Удаляем существующее уведомление
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            z-index: 1000;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease-out;
            pointer-events: none;
        `;
        
        document.body.appendChild(notification);
        
        // Автоматически скрываем через 2 секунды
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    // Добавляем CSS анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flashFade {
            0% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        /* Стили для загрузки */
        .hall-button.loading {
            opacity: 0.7;
            cursor: wait;
        }
        
        .hall-button.loading .button-image {
            filter: blur(2px);
        }
        
        /* Оптимизация для touch-устройств */
        @media (max-width: 768px) {
            .hall-button:active {
                transform: scale(0.95) !important;
            }
            
            .custom-notification {
                font-size: 14px !important;
                padding: 12px 24px !important;
                bottom: 20px !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Предзагрузка изображений для плавного отображения
    function preloadImages() {
        const images = document.querySelectorAll('.button-image');
        images.forEach(img => {
            const url = img.style.backgroundImage.slice(5, -2);
            if (url) {
                const preloadImg = new Image();
                preloadImg.src = url;
            }
        });
    }
    
    preloadImages();
});

// ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ - РАБОТАЕТ 100%
function fixBackground() {
    const img = document.querySelector('.museum-background');
    if (!img) return;
    
    // Убираем все старые стили
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.zIndex = '1';
}

// Запускаем сразу
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixBackground);
} else {
    fixBackground();
}

// Следим за изменениями размера
window.addEventListener('resize', fixBackground);