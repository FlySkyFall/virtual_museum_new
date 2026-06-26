// JavaScript для военно-исторического зала

document.addEventListener('DOMContentLoaded', () => {
    const warsContainer = document.getElementById('militaryWarsContainer');
    
    // Загружаем данные войн
    async function loadWars() {
        try {
            const response = await fetch('/hall/api/wars');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            const wars = await response.json();
            renderWars(wars);
        } catch (error) {
            console.error('Ошибка загрузки войн:', error);
            if (warsContainer) {
                warsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:red;font-size:18px;">Ошибка загрузки данных</div>';
            }
        }
    }
    
    // Функция отображения войн
    function renderWars(wars) {
        if (!warsContainer) return;
        
        warsContainer.innerHTML = '';
        
        wars.forEach((war, index) => {
            const button = createWarButton(war, index);
            warsContainer.appendChild(button);
        });
        
        // Применяем отступ для первой кнопки
        const firstBtn = warsContainer.querySelector('.military-war-button:first-child');
        if (firstBtn) {
            firstBtn.classList.add('first-btn');
        }
    }
    
    // Функция создания кнопки войны
    function createWarButton(war, index) {
        const button = document.createElement('button');
        button.className = 'military-war-button';
        button.dataset.warId = war._id;
        button.dataset.warName = war.name;
        
        button.style.animationDelay = `${(index + 1) * 0.15}s`;
        
        button.innerHTML = `
            <div class="military-war-button-bg" style="background-image: url('${war.buttonImagePath}');"></div>
        `;
        
        // Эффект ripple при клике
        button.addEventListener('click', (e) => {
            const warId = button.dataset.warId;
            const warName = button.dataset.warName;
            
            createMilitaryRippleEffect(button, e);
            console.log(`Переход к артефактам войны: ${warName}`);
            
            // Открываем страницу с артефактами в новом окне
            setTimeout(() => {
                window.open(`/hall/military-history/war/${warId}`, '_blank');
            }, 300);
        });
        
        return button;
    }
    
    // Функция создания ripple эффекта
    function createMilitaryRippleEffect(element, event) {
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
            animation: militaryRippleEffect 0.6s ease-out;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // Добавляем стили для ripple эффекта
    const style = document.createElement('style');
    style.textContent = `
        @keyframes militaryRippleEffect {
            from { transform: scale(0); opacity: 0.7; }
            to { transform: scale(4); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Загружаем войны
    loadWars();
});