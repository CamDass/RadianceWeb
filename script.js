/* =========================================
   SYSTÈME AMBILIGHT & FEEDBACK VOLUME PRO
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('main-video');
    const canvas = document.getElementById('ambilight-canvas');
    const wrapper = document.querySelector('.video-wrapper');
    const feedback = document.getElementById('volume-feedback');

    if (!video || !canvas || !wrapper) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 32;
    canvas.height = 18;
    let animationFrameId;
    let feedbackTimeout;

    // Icônes SVG stockées dans le JS pour la permutation
    const iconUnmuted = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const iconMuted = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

    function drawAmbilight() {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(drawAmbilight);
    }

    // --- FONCTION DE FEEDBACK VISUEL ---
    function showFeedback(isMuted) {
        // On annule le précédent timeout s'il y en a un
        clearTimeout(feedbackTimeout);
        
        // On injecte le bon SVG
        feedback.innerHTML = isMuted ? iconMuted : iconUnmuted;
        
        // On affiche l'overlay (fade in)
        feedback.classList.add('show');

        // On cache après 1 seconde (fade out)
        feedbackTimeout = setTimeout(() => {
            feedback.classList.remove('show');
        }, 1000);
    }

    function toggleMute() {
        if (video.muted) {
            video.muted = false;
            showFeedback(false); // Feedback "Son allumé"
        } else {
            video.muted = true;
            showFeedback(true); // Feedback "Mute"
        }
    }

    // Le clic se fait maintenant directement sur la vidéo
    video.addEventListener('click', toggleMute);

    video.addEventListener('play', () => {
        wrapper.classList.add('is-active');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        drawAmbilight(); 
    });

    if (!video.paused) {
        wrapper.classList.add('is-active');
        drawAmbilight();
    } else {
        video.addEventListener('loadeddata', () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            wrapper.classList.add('is-active');
        });
    }
});



/* =========================================
   GESTION DU MENU BURGER PLEIN ÉCRAN
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    const burgerBtn = document.getElementById('burger-btn');
    const fullMenu = document.getElementById('full-menu');
    const menuLinks = document.querySelectorAll('.menu-link');

    // Sécurité : on vérifie que les éléments existent
    if (burgerBtn && fullMenu) {
        // Clic sur le bouton burger
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('is-active'); // Animation de la croix
            fullMenu.classList.toggle('is-open');    // Affichage de l'overlay
            document.body.classList.toggle('no-scroll'); // Bloque le défilement du site
        });

        // Clic sur un lien du menu : on ferme le menu
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('is-active');
                fullMenu.classList.remove('is-open');
                document.body.classList.remove('no-scroll');
            });
        });
    }
});


/* =========================================
   INITIALISATION DU CARROUSEL (SPLIDE)
========================================= */
document.addEventListener('DOMContentLoaded', function () {
    const carouselElement = document.getElementById('events-carousel');
    
    // On vérifie si le carrousel est présent sur la page
    if (carouselElement) {
        new Splide(carouselElement, {
            type   : 'loop',       // Tourne en boucle
            perPage: 3,            // Affiche 3 images sur PC
            perMove: 1,            // Décale d'une image à la fois
            gap    : '20px',       // Espace entre les images
            focus  : 'center',     // L'image du milieu est la principale
            autoplay: true,        // Défilement auto
            interval: 3000,        // Pause de 3s entre chaque défilement
            pagination: true,      // Affiche les petits points
            breakpoints: {
                992: {
                    perPage: 2,    // 2 images sur tablette
                    focus  : 0     // Enlève le focus central sur petit écran
                },
                576: {
                    perPage: 1     // 1 image sur mobile
                }
            }
        }).mount();
    }
});



/* =========================================
   CARROUSEL AVEC VÉRITABLE AMBILIGHT
========================================= */
document.addEventListener('DOMContentLoaded', function () {
    const carouselElement = document.getElementById('events-carousel');
    const ambilightBg = document.getElementById('carousel-ambilight'); // Le calque du fond

    if (carouselElement && ambilightBg) {
        // 1. On crée l'instance Splide
        const splide = new Splide(carouselElement, {
            type   : 'loop',
            perPage: 3,
            perMove: 1,
            gap    : '30px',
            focus  : 'center',
            autoplay: true,
            interval: 3000,
            pagination: false,
            breakpoints: {
                992: { perPage: 2, focus: 0 },
                576: { perPage: 1 }
            }
        });

        // 2. FONCTION POUR METTRE À JOUR L'AMBILIGHT
        function updateAmbilight() {
            // On va chercher l'image de la slide centrale (active)
            const activeSlide = splide.Components.Slides.getAt(splide.index);
            if (activeSlide) {
                const activeImg = activeSlide.slide.querySelector('img');
                if (activeImg) {
                    const imgSrc = activeImg.getAttribute('src');
                    // On applique cette image comme fond de l'ambilight
                    ambilightBg.style.backgroundImage = `url('${imgSrc}')`;
                }
            }
        }

        // 3. On applique l'effet dès le chargement
        splide.on('mounted', updateAmbilight);

        // 4. On met à jour à chaque fois que le carrousel défile (move)
        splide.on('move', updateAmbilight);

        // 5. On allume
        splide.mount();
    }
});