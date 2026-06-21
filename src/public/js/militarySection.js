// JavaScript для страницы раздела военно-исторического зала

document.addEventListener('DOMContentLoaded', () => {
    const artifactButtons = document.querySelectorAll('.artifact-button');
    const sectionId = window.location.pathname.split('/').pop();
    
    console.log(`Найдено ${artifactButtons.length} артефактов в разделе`);
    
    artifactButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const artifactIndex = button.dataset.artifactIndex;
            const artifactName = button.dataset.artifactName;
            
            createRippleEffect(button, e);
            console.log(`Переход на страницу артефакта: ${artifactName}`);
            showNotification(`Загрузка артефакта "${artifactName}"...`);
            
            setTimeout(() => {
                window.location.href = `/hall/military-artifacts/${sectionId}?page=1`;
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
    
    function showNotification(message) {
        const existingNotification = document.querySelector('.military-notification');
        if (existingNotification) existingNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = 'military-notification';
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
});