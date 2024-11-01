document.addEventListener('DOMContentLoaded', () => {
    const progress = document.querySelector('.progress');
    const loadingText = document.querySelector('.loading-text');
    const texts = [
        'Loading your beauty experience...',
        'Preparing your glamour...',
        'Getting things ready...',
        'Almost there...'
    ];
    let currentText = 0;

    // Change loading text
    const textInterval = setInterval(() => {
        currentText = (currentText + 1) % texts.length;
        loadingText.style.opacity = '0';
        
        setTimeout(() => {
            loadingText.textContent = texts[currentText];
            loadingText.style.opacity = '1';
        }, 500);
    }, 1000);

    // Redirect after animation
    setTimeout(() => {
        clearInterval(textInterval);
        progress.style.width = '100%';
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 500);
    }, 2500);
}); 