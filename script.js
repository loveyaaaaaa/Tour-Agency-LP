document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. Плавный скролл (Smooth Scroll) для якорных ссылок
    // ==========================================================================
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');

            // Пропускаем пустые ссылки
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Учитываем высоту фиксированной шапки, чтобы она не перекрывала контент
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================================================
    // 2. Изменение фона шапки при скролле страницы
    // ==========================================================================
    const header = document.querySelector('.site-header');
    const scrollThreshold = 50; // Количество пикселей для срабатывания эффекта

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    };

    // Слушаем событие скролла
    window.addEventListener('scroll', handleScroll);
    // Проверяем позицию при загрузке страницы (если пользователь обновил страницу в середине)
    handleScroll();

    // ==========================================================================
    // 3. Отправка формы на FastAPI Backend (fetch)
    // ==========================================================================
    const leadForm = document.querySelector('.tour-form');

    // Укажите URL вашего запущенного бэкенда
    const API_URL = 'http://127.0.0.1:8000/api/tour-request';

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameValue = document.getElementById('user-name').value.trim();
            const contactValue = document.getElementById('user-contact').value.trim();
            const destinationValue = document.getElementById('user-destination').value.trim();
            const submitBtn = leadForm.querySelector('.btn-submit');

            if (!nameValue || !contactValue) {
                alert('Пожалуйста, заполните обязательные поля: "Ваше имя" и "Телефон или мессенджер".');
                return;
            }

            // Формируем payload в соответствии с Pydantic-моделью TourRequest
            const payload = {
                name: nameValue,
                phone: contactValue,
                comment: destinationValue || null
            };

            // Блокируем кнопку, чтобы избежать двойной отправки
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(`Спасибо, ${nameValue}! Ваша заявка успешно отправлена.`);
                    leadForm.reset();
                } else {
                    // Обработка ошибок валидации от FastAPI (код 422) или сервера (500)
                    const errorData = await response.json();
                    console.error('Ошибка API:', errorData);
                    alert('Произошла ошибка при отправке заявки. Проверьте корректность данных.');
                }
            } catch (error) {
                console.error('Сетевая ошибка:', error);
                alert('Не удалось подключиться к серверу. Попробуйте позже.');
            } finally {
                // Разблокируем кнопку
                submitBtn.disabled = false;
                submitBtn.textContent = 'Обсудить путешествие';
            }
        });
    }
});