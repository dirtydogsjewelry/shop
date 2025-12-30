// Подключение Lottie-плеера: если используешь lottie json, включи обработчик.
// Код корректно работает и если Lottie отсутствует (нет ошибок).

const lottie = document.getElementById('dogLottie');
const fallbackImg = document.getElementById('dogFallback');

if (lottie) {
  // Пример: при клике — воспроизвести одну итерацию
  lottie.addEventListener('click', () => {
    // Если анимация в loop, можно временно play() и остановить через timeout, либо убрать loop в markup
    lottie.play();
    setTimeout(() => lottie.stop(), 3000); 
  });
}
// ==========================
// LOGO ANIMATION SAFE INIT
// ==========================

const logo = document.querySelector('.brand-head');

if (logo) {
  logo.addEventListener('click', (e) => {
    logo.style.animation = 'none';
    void logo.offsetWidth;
    logo.style.animation = 'bounce 0.8s ease';
  });
}