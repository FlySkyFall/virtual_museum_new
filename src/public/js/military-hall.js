// JavaScript для военно-исторического зала

document.addEventListener('DOMContentLoaded', () => {
    const warsContainer = document.getElementById('warsContainer');
    
    // Загружаем данные войн
    async function loadWars() {
        try {
            const response = await fetch('/hall/api/wars'); // Путь к API
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            const wars = await response.json();
            renderWars(wars);
        } catch (error) {
            console.error('Ошибка загрузки войн:', error);
            warsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:red;font-size:18px;">Ошибка загрузки данных</div>';
        }
    }
    
    // Функция отображения войн
    function renderWars(wars) {
        warsContainer.innerHTML = '';
        
        wars.forEach((war, index) => {
            const button = createWarButton(war, index);
            warsContainer.appendChild(button);
        });
        
        // Применяем отступ для первой кнопки
        const firstBtn = warsContainer.querySelector('.war-button:first-child');
        if (firstBtn) {
            firstBtn.classList.add('first-btn');
        }
    }
    
    // Функция создания кнопки войны
    function createWarButton(war, index) {
        const button = document.createElement('button');
        button.className = 'war-button';
        button.dataset.warId = war._id;
        button.dataset.warName = war.name;
        
        button.style.animationDelay = `${(index + 1) * 0.15}s`;
        
        button.innerHTML = `
            <div class="war-button-bg" style="background-image: url('${war.buttonImagePath}');"></div>
        `;
        
        button.addEventListener('click', () => {
            const warId = button.dataset.warId;
            window.open(`/hall/military-history/war/${warId}`, '_blank');
        });
        
        return button;
    }
    
    loadWars();
});