document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('main-video');
    const canvas = document.getElementById('ambilight-canvas');
    const wrapper = document.querySelector('.video-wrapper');
    const playOverlay = document.querySelector('.play-button-overlay');

    if (!video || !canvas || !wrapper) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Petite résolution pour la performance (le flou CSS fait le reste)
    canvas.width = 32;
    canvas.height = 18;
    
    let animationFrameId;

    // --- 1. FONCTION POUR DESSINER LA VIDÉO (BOUCLE) ---
    function drawAmbilight() {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(drawAmbilight);
    }

    // --- 2. NOUVELLE FONCTION : DESSINER LE POSTER AU DÉBUT ---
    function initAmbilightWithPoster() {
        const posterUrl = video.getAttribute('poster');
        
        if (posterUrl) {
            // On crée une image temporaire en JS
            const img = new Image();
            img.src = posterUrl;
            
            // Dès que l'image est chargée par le navigateur
            img.onload = () => {
                // On la dessine sur le canvas
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Et on allume la lumière
                wrapper.classList.add('is-active');
            };
        }
    }

    // --- 3. LOGIQUE PLAY / PAUSE ---
    function togglePlay() {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }

    playOverlay.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);


    // --- 4. ÉVÉNEMENTS ---

    // Lancement immédiat de l'effet avec l'image poster
    initAmbilightWithPoster();

    video.addEventListener('play', () => {
        wrapper.classList.add('is-playing');
        wrapper.classList.add('is-active');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        drawAmbilight(); // On passe au mode "Vidéo dynamique"
    });

    video.addEventListener('pause', () => {
        wrapper.classList.remove('is-playing');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });

    video.addEventListener('ended', () => {
        wrapper.classList.remove('is-playing');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });
});