/* =========================================
   FEATURE: Hero Carousel
   Description: Hero slider with auto-play
   ========================================= */

let carouselInitialized = false;

/** ⚙️ Action: Initialize hero carousel */
/** ?? Action */
/** ?? Core */
export const initHeroCarousel = () => {
    if (carouselInitialized) return;
    carouselInitialized = true;

    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.querySelector('.hero-nav-btn.prev');
    const nextBtn = document.querySelector('.hero-nav-btn.next');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    };

    const nextSlide = () => showSlide(currentSlide + 1);
    const prevSlideFn = () => showSlide(currentSlide - 1);

    const startSlideTimer = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    };

    nextBtn.addEventListener('click', () => { nextSlide(); startSlideTimer(); });
    prevBtn.addEventListener('click', () => { prevSlideFn(); startSlideTimer(); });
    indicators.forEach((ind, i) => {
        ind.addEventListener('click', () => { showSlide(i); startSlideTimer(); });
    });

    const heroBtns = document.querySelectorAll('.hero-btn');
    heroBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            let category = 'All';
            if (index === 1) category = 'GPUs';
            if (index === 2) category = 'Pre-builts';

            const filterLink = document.querySelector(`.category-filter[data-category="${category}"]`);
            filterLink.click();
        });
    });

    startSlideTimer();

    const timerEl = document.getElementById('countdown-timer');
    let time = 86400;
    setInterval(() => {
        time--;
        if (time < 0) time = 86400;
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = time % 60;
        timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
};
