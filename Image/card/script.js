// Подключение Lottie-плеера: если используешь lottie json, включи обработчик.
// Код корректно работает и если Lottie отсутствует (нет ошибок).

const lottie = document.getElementById('dogLottie');
const extraText = document.querySelector('.brand-extra-text');

let lottiePlaying = false;
let stopTimer = null;

const phrases = [
  'Ну я же просил...',
  'Опять ты кликаешь 😐',
  'Я же собака, не кнопка',
  'Хватит. Правда.',
  'Ладно, последний раз'
];

let phraseIndex = 0;

if (lottie && extraText) {
  lottie.addEventListener('click', () => {
    if (lottiePlaying) return;

    lottiePlaying = true;

    // текст
    extraText.textContent = phrases[phraseIndex];
    extraText.classList.add('visible');
    phraseIndex = (phraseIndex + 1) % phrases.length;

    // анимация
    lottie.stop();
    lottie.play();

    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      lottie.stop();
      lottiePlaying = false;
    }, 3000);
  });
}



// ==========================
// LOGO ANIMATION SAFE INIT
// ==========================

const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-links a');

if (burger && navLinks) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  });

  navItems.forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('no-scroll');
    });
  });
}


