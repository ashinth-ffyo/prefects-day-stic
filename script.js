document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('playBtn');
  const audio = document.getElementById('bg-audio');
  const logo = document.querySelector('.logo');
  const details = document.getElementById('details');
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const scrollArrow = document.getElementById('scrollArrow');

  const introText = document.getElementById('introText');

  // When "Click to Begin" is pressed
  function beginExperience() {
    // animate button fade then hide
    playBtn.disabled = true;
    playBtn.classList.add('fade-out');
    setTimeout(() => playBtn.style.display = 'none', 440);

    // Start audio
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    // Show intro lines briefly
    if (introText) {
      introText.setAttribute('aria-hidden', 'false');
      introText.classList.add('show');
    }

    // after ~1s, fade intro lines out (then start logo animation)
    const introVisibleMs = 2000;
    const introFadeMs = 900; // matches CSS fade duration
    setTimeout(() => {
      if (introText) {
        introText.classList.remove('show');
        introText.classList.add('fade');
      }

      // after fade completes, remove intro and start logo animation
      setTimeout(() => {
        if (introText) {
          introText.style.display = 'none';
          introText.setAttribute('aria-hidden', 'true');
        }

        // Logo animation (5s)
        const anim = logo.animate([
          { opacity: 0, transform: "translateY(20px) scale(0.85)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ], {
          duration: 5000,
          easing: "cubic-bezier(.22,.9,.34,1)",
          fill: "forwards"
        });

        anim.onfinish = () => {
          // Fade out audio before playing video
          if (audio) {
            const fadeDuration = 2000; // 2 seconds
            const steps = 20;
            const stepTime = fadeDuration / steps;
            let currentStep = 0;
            const fadeInterval = setInterval(() => {
              currentStep++;
              audio.volume = Math.max(0, audio.volume - 1 / steps);
              if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audio.pause();
              }
            }, stepTime);
          }

          // Play the video full screen after fade
          setTimeout(() => {
            const video = document.getElementById('eventVideo');
            if (video) {
              video.classList.add('fullscreen');
              video.play().catch(() => {});

              // After video ends, scroll down and reveal details
              video.addEventListener('ended', () => {
                video.classList.remove('fullscreen');
                // Show scroll arrow
                if (scrollArrow) {
                  setTimeout(() => scrollArrow.classList.add('show'), 200);
                }
                // Scroll to details
                const arrowVisibleDelay = 1200;
                setTimeout(() => {
                  if (details) {
                    details.setAttribute("aria-hidden", "false");
                    const top = details.getBoundingClientRect().top + window.pageYOffset - 24;
                    window.scrollTo({ top, behavior: "smooth" });

                    setTimeout(() => {
                      revealItems.forEach((el, i) => {
                        setTimeout(() => el.classList.add("visible"), i * 120);
                      });

                      const qrCollection = document.getElementById('qrCollection');
                      if (qrCollection) {
                        qrCollection.setAttribute('aria-hidden', 'false');
                        const cards = Array.from(qrCollection.querySelectorAll('.qr-card'));
                        cards.forEach((card, idx) => {
                          setTimeout(() => card.classList.add('visible'), 600 + idx * 160);
                        });
                      }
                    }, 700);
                  }
                }, arrowVisibleDelay);
              });
            }
          }, 2000);
        };

      }, introFadeMs);
    }, introVisibleMs);
  }

  playBtn.addEventListener("click", beginExperience, { once: true });

});
