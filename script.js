document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('playBtn');
  const audio = document.getElementById('bg-audio');
  const logo = document.querySelector('.logo');
  const details = document.getElementById('details');
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const scrollArrow = document.getElementById('scrollArrow');

  const introText = document.getElementById('introText');

  // Buffer system to prevent lag
  const animationBuffer = {
    queue: [],
    isProcessing: false,
    
    add(callback, delay = 0) {
      this.queue.push({ callback, delay, startTime: Date.now() });
      this.process();
    },
    
    process() {
      if (this.isProcessing || this.queue.length === 0) return;
      
      this.isProcessing = true;
      requestAnimationFrame(() => {
        const now = Date.now();
        const ready = this.queue.filter(item => now - item.startTime >= item.delay);
        
        ready.forEach(item => {
          try {
            item.callback();
          } catch (e) {
            console.error('Animation buffer error:', e);
          }
        });
        
        this.queue = this.queue.filter(item => now - item.startTime < item.delay);
        this.isProcessing = false;
        
        if (this.queue.length > 0) {
          requestAnimationFrame(() => this.process());
        }
      });
    }
  };

  // When "Click to Begin" is pressed
  function beginExperience() {
    // animate button fade then hide
    playBtn.disabled = true;
    playBtn.classList.add('fade-out');
    animationBuffer.add(() => playBtn.style.display = 'none', 440);

    // Start audio
    if (audio) {
      animationBuffer.add(() => {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }, 0);
    }

    // Show intro lines briefly
    if (introText) {
      introText.setAttribute('aria-hidden', 'false');
      introText.classList.add('show');
    }

    // after ~1s, fade intro lines out (then start logo animation)
    const introVisibleMs = 2000;
    const introFadeMs = 900; // matches CSS fade duration
    animationBuffer.add(() => {
      if (introText) {
        introText.classList.remove('show');
        introText.classList.add('fade');
      }

      // after fade completes, remove intro and start logo animation
      animationBuffer.add(() => {
        if (introText) {
          introText.style.display = 'none';
          introText.setAttribute('aria-hidden', 'true');
        }

        // Logo animation (5s) - using requestAnimationFrame for smooth performance
        const anim = logo.animate([
          { opacity: 0, transform: "translateY(20px) scale(0.85)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ], {
          duration: 5000,
          easing: "cubic-bezier(.22,.9,.34,1)",
          fill: "forwards"
        });

        anim.onfinish = () => {
          // Fade out audio before playing video using RAF
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

          // Play the video full screen after fade with buffer check
          animationBuffer.add(() => {
            const video = document.getElementById('eventVideo');
            if (video) {
              video.classList.add('fullscreen');
              
              // Buffer the video to prevent lag
              const bufferVideo = () => {
                // Pre-load the video
                video.load();
                
                // Wait for video to be ready to play
                const onCanPlay = () => {
                  video.removeEventListener('canplay', onCanPlay);
                  video.removeEventListener('error', onError);
                  // Buffer more data before playing
                  if (video.buffered.length > 0) {
                    video.play().catch(() => {});
                  }
                };
                
                const onError = () => {
                  video.removeEventListener('canplay', onCanPlay);
                  video.removeEventListener('error', onError);
                  // Retry after error
                  setTimeout(() => bufferVideo(), 1000);
                };
                
                video.addEventListener('canplay', onCanPlay, { once: true });
                video.addEventListener('error', onError, { once: true });
                
                // Timeout failsafe - play anyway after 3 seconds
                setTimeout(() => {
                  video.removeEventListener('canplay', onCanPlay);
                  video.removeEventListener('error', onError);
                  video.play().catch(() => {});
                }, 3000);
              };
              
              bufferVideo();

              // After video ends, scroll down and reveal details
              video.addEventListener('ended', () => {
                video.classList.remove('fullscreen');
                // Show scroll arrow
                if (scrollArrow) {
                  animationBuffer.add(() => scrollArrow.classList.add('show'), 200);
                }
                // Scroll to details
                const arrowVisibleDelay = 1200;
                animationBuffer.add(() => {
                  if (details) {
                    details.setAttribute("aria-hidden", "false");
                    const top = details.getBoundingClientRect().top + window.pageYOffset - 24;
                    window.scrollTo({ top, behavior: "smooth" });

                    animationBuffer.add(() => {
                      revealItems.forEach((el, i) => {
                        animationBuffer.add(() => el.classList.add("visible"), i * 120);
                      });

                      const qrCollection = document.getElementById('qrCollection');
                      if (qrCollection) {
                        qrCollection.setAttribute('aria-hidden', 'false');
                        const cards = Array.from(qrCollection.querySelectorAll('.qr-card'));
                        cards.forEach((card, idx) => {
                          animationBuffer.add(() => card.classList.add('visible'), 600 + idx * 160);
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
