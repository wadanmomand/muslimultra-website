/**
 * Muslim Ultra — Journey Scroll & Motion Controller (journey.js)
 * Smooth Lenis scroll integration + GSAP ScrollTrigger camera progression.
 * Features:
 *  - Exposes scroll progress (0..1) to Cosmos.setProgress(p)
 *  - Native scroll fallback if Lenis/GSAP CDN fails
 *  - Non-blocking reveals (.from() only, content visible by default)
 *  - Robust mobile drawer navigation (tap targets >= 48px, zero layout shift)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Journey = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenisInstance = null;

  // 1. Mobile Navigation Setup
  function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backdrop = document.querySelector('.mobile-backdrop');

    if (!toggleBtn || !navLinks) return;

    function openNav() {
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('menu-open');
    }

    function closeNav() {
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('menu-open');
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navLinks.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeNav);
    }

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
      }
    });
  }

  // 2. Lenis Smooth Scroll Setup
  function initLenis() {
    if (prefersReducedMotion || typeof window.Lenis === 'undefined') {
      return null;
    }

    try {
      lenisInstance = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false // native touch on mobile for best response
      });

      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Connect Lenis to GSAP ScrollTrigger if present
      if (window.ScrollTrigger) {
        lenisInstance.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });
        window.gsap.ticker.lagSmoothing(0);
      }

      return lenisInstance;
    } catch (err) {
      console.warn('[Journey] Lenis initialization error, using native scroll:', err);
      return null;
    }
  }

  // 3. Scroll Progress Rail Connection to Cosmos
  function initScrollProgressRail() {
    function computeProgress() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return 0;
      return Math.max(0, Math.min(1, window.scrollY / docHeight));
    }

    if (window.ScrollTrigger && window.gsap && !prefersReducedMotion) {
      window.ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self) => {
          if (window.Cosmos && window.Cosmos.setProgress) {
            window.Cosmos.setProgress(self.progress);
          }
        }
      });
    } else {
      // Native scroll fallback
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (window.Cosmos && window.Cosmos.setProgress) {
              window.Cosmos.setProgress(computeProgress());
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // 4. Safe Content Reveals (.from() ONLY - Visible by default!)
  function initSafeReveals() {
    if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    const cards = document.querySelectorAll('.glass-card, .card, .academy-card, .app-feature-card, .phone');
    if (cards.length > 0) {
      cards.forEach((card) => {
        window.gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          y: 28,
          opacity: 0.2, // Subtle fade-in, remains visible
          duration: 0.9,
          ease: 'power2.out'
        });
      });
    }
  }

  // 5. Floating Navbar Scroll Condenser & Back-To-Top Trigger
  function initHeaderAndBackToTop() {
    const navbar = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('back-to-top');

    function onScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Navbar scroll condenser (> 40px)
      if (navbar) {
        if (scrollY > 40) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }

      // Back to top button (> 600px)
      if (backToTopBtn) {
        if (scrollY > 600) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (lenisInstance) {
          lenisInstance.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  const Journey = {
    init: function () {
      initMobileNav();
      initLenis();
      initScrollProgressRail();
      initSafeReveals();
      initHeaderAndBackToTop();
      console.log('[Journey] Motion and scroll controller initialized.');
      return this;
    }
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Journey.init());
  } else {
    Journey.init();
  }

  return Journey;
}));
