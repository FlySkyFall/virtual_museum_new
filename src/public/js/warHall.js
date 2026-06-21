// JavaScript для военно-исторического зала

document.addEventListener('DOMContentLoaded', () => {
    // Находим все кнопки разделов
    const sectionButtons = document.querySelectorAll('.section-button');
    
    console.log(`Найдено ${sectionButtons.length} разделов в военно-историческом зале`);
    
    // Добавляем обработчики событий для каждой кнопки
    sectionButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const sectionId = button.dataset.sectionId;
            const sectionTitle = button.dataset.sectionTitle;
            
            createRippleEffect(button, e);
            console.log(`Переход на страницу раздела: ${sectionTitle} (ID: ${sectionId})`);
            showNotification(`Загрузка раздела "${sectionTitle}"...`);
            addLoadingToButton(button);
            
            setTimeout(() => {
                window.location.href = `/hall/war-section/${sectionId}`;
            }, 500);
        });
    });
    
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
    
    function addLoadingToButton(button) {
        const titleElement = button.querySelector('.section-main');
        
        const originalTitle = titleElement?.textContent || '';
        
        if (titleElement) titleElement.textContent = 'Загрузка...';
        
        button.classList.add('loading');
        
        setTimeout(() => {
            if (button.classList.contains('loading')) {
                if (titleElement) titleElement.textContent = originalTitle;
                button.classList.remove('loading');
            }
        }, 5000);
    }
    
    function showNotification(message) {
        const existingNotification = document.querySelector('.war-hall-notification');
        if (existingNotification) existingNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = 'war-hall-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #2c3e50 0%, #4a6741 100%);
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
    
    // Добавляем стили для загрузки
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
        .section-button.loading {
            opacity: 0.8;
            cursor: wait;
            animation: loadingPulse 1s infinite;
        }
        .section-button.loading .section-button-bg {
            filter: blur(2px);
        }
        @keyframes loadingPulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.6; }
        }
    `;
    document.head.appendChild(style);
});