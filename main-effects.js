/**
 * Muslim Ultra — Celestial Motion & Interactive FX Engine (GSAP + Vanilla)
 * Provides 3D card tilts, scroll-triggered reveals, smooth counters, and mobile navigation.
 */

(function () {
  'use strict';

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Mobile Menu Toggle
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backdrop = document.querySelector('.mobile-backdrop');

    if (!toggleBtn || !navLinks) return;

    function openMenu() {
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('menu-open');
    }

    function closeMenu() {
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('menu-open');
    }

    toggleBtn.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // 2. Interactive 3D Card Hover Tilt (Vanilla JS)
  function initCardTilt() {
    if (prefersReducedMotion || window.innerWidth < 900) return;

    const tiltCards = document.querySelectorAll('.card, .academy-card, .app-feature-card, .phone, .banner-wrapper');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  // 3. GSAP ScrollTrigger Section & Element Reveals
  function initGSAPAnimations() {
    if (prefersReducedMotion) return;

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });

      heroTl
        .from('.hero .badge-pill', { y: -25, opacity: 0, duration: 0.7, delay: 0.2 })
        .from('.hero h1', { y: 35, opacity: 0, duration: 0.9 }, '-=0.4')
        .from('.hero p.lead', { y: 25, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.hero-actions', { y: 20, opacity: 0, scale: 0.95, duration: 0.7 }, '-=0.5')
        .from('.hero .grid-3 .card', {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15
        }, '-=0.4');

      // Reveal Sections & Cards
      const sections = document.querySelectorAll('.academy-spotlight-section, .features-section, .shots');
      sections.forEach((section) => {
        gsap.from(section.querySelectorAll('.section-header, .section-head, .academy-badge-tag, h2, .lead'), {
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            toggleActions: 'play none none none'
          },
          y: 35,
          opacity: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power2.out'
        });

        const cards = section.querySelectorAll('.academy-card, .app-feature-card, .phone, .privacy-banner, .banner-wrapper');
        if (cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out'
          });
        }
      });
    } else {
      // Fallback intersection observer if GSAP is not loaded
      const revealElements = document.querySelectorAll('.card, .academy-card, .app-feature-card, .phone, .privacy-banner');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      revealElements.forEach((el) => {
        el.classList.add('reveal-item');
        observer.observe(el);
      });
    }
  }

  // 4. Glow Mouse Follower on Cards (Specular Highlight)
  function initSpecularHighlights() {
    const cards = document.querySelectorAll('.card, .academy-card, .app-feature-card, .form-card, .privacy-banner');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // Initialize all on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initCardTilt();
    initGSAPAnimations();
    initSpecularHighlights();
  });
})();
