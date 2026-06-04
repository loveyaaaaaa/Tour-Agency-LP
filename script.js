document.addEventListener('DOMContentLoaded', () => {

    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
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

    const header = document.querySelector('.site-header');
    const scrollThreshold = 50;

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll();

    const leadForm = document.querySelector('.tour-form');

    const API_URL = 'https://travelpro-backend.onrender.com/api/tour-request';

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

            const payload = {
                name: nameValue,
                phone: contactValue,
                comment: destinationValue || null
            };

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
                submitBtn.disabled = false;
                submitBtn.textContent = 'Обсудить путешествие';
            }
        });
    }
});