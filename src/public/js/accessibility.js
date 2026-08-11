// ============================================
// МОДУЛЬ ДОСТУПНОСТИ
// ============================================

(function() {
    'use strict';

    // ===== ПОИСК =====
    const searchToggle = document.getElementById('searchToggle');
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    // Открытие/закрытие модального окна поиска
    function toggleSearch() {
        if (searchModal.classList.contains('active')) {
            closeSearch();
        } else {
            openSearch();
        }
    }

    function openSearch() {
        searchModal.classList.add('active');
        searchInput.focus();
        document.body.style.overflow = 'hidden';
        
        // Очищаем предыдущие результаты
        searchResults.innerHTML = '';
        searchResults.classList.remove('has-results');
    }

    function closeSearch() {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.remove('has-results');
    }

    // Закрытие по клику вне модального окна
    searchModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeSearch();
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            closeSearch();
        }
    });

    // Поиск
    function performSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            searchResults.innerHTML = '<div class="search-result-empty">Введите запрос для поиска</div>';
            searchResults.classList.add('has-results');
            return;
        }

        if (query.length < 2) {
            searchResults.innerHTML = '<div class="search-result-empty">Введите минимум 2 символа</div>';
            searchResults.classList.add('has-results');
            return;
        }

        // Показываем индикатор загрузки
        searchResults.innerHTML = '<div class="search-result-empty">⏳ Поиск...</div>';
        searchResults.classList.add('has-results');

        // Выполняем поиск на сервере
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка поиска');
                return response.json();
            })
            .then(data => {
                displayResults(data);
            })
            .catch(error => {
                console.error('Ошибка поиска:', error);
                searchResults.innerHTML = '<div class="search-result-empty">❌ Ошибка при выполнении поиска</div>';
                searchResults.classList.add('has-results');
            });
    }

    function displayResults(results) {
        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-empty">🔍 Ничего не найдено</div>';
            searchResults.classList.add('has-results');
            return;
        }

        let html = '';
        results.forEach(item => {
            html += `
                <div class="search-result-item" data-url="${item.url}">
                    <div class="search-result-title">${highlightText(item.title, searchInput.value.trim())}</div>
                    <div class="search-result-description">${highlightText(item.description || '', searchInput.value.trim())}</div>
                </div>
            `;
        });

        searchResults.innerHTML = html;
        searchResults.classList.add('has-results');

        // Добавляем обработчики кликов на результаты
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const url = this.dataset.url;
                if (url) {
                    window.location.href = url;
                }
            });
        });
    }

    // Подсветка найденного текста
    function highlightText(text, query) {
        if (!text || !query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark style="background:#ffeb3b;padding:0 2px;">$1</mark>');
    }

    // Обработчики для поиска
    searchToggle.addEventListener('click', toggleSearch);

    searchButton.addEventListener('click', performSearch);

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Поиск с задержкой (debounce)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        if (query.length >= 2) {
            searchTimeout = setTimeout(performSearch, 500);
        } else if (query.length === 0) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
        }
    });

    // ===== ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ =====
    const visionToggle = document.getElementById('visionToggle');
    const VISION_MODE_KEY = 'visionModeEnabled';

    // Проверяем сохраненное состояние
    function loadVisionMode() {
        const saved = localStorage.getItem(VISION_MODE_KEY);
        if (saved === 'true') {
            enableVisionMode();
        }
    }

    function enableVisionMode() {
        document.body.classList.add('vision-mode');
        visionToggle.classList.add('active');
        localStorage.setItem(VISION_MODE_KEY, 'true');
        console.log('👁️ Версия для слабовидящих включена');
    }

    function disableVisionMode() {
        document.body.classList.remove('vision-mode');
        visionToggle.classList.remove('active');
        localStorage.setItem(VISION_MODE_KEY, 'false');
        console.log('👁️ Версия для слабовидящих выключена');
    }

    function toggleVisionMode() {
        if (document.body.classList.contains('vision-mode')) {
            disableVisionMode();
        } else {
            enableVisionMode();
        }
    }

    visionToggle.addEventListener('click', toggleVisionMode);

    // Инициализация
    loadVisionMode();

    // ===== ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ =====
    // Улучшенная навигация с клавиатуры для поиска
    document.addEventListener('keydown', function(e) {
        // Ctrl+F или Cmd+F для открытия поиска
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (!searchModal.classList.contains('active')) {
                openSearch();
            }
        }
    });

    // Фокус на поле поиска при открытии
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class' && 
                searchModal.classList.contains('active')) {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            }
        });
    });

    observer.observe(searchModal, { attributes: true });

    console.log('♿ Модуль доступности загружен');
})();