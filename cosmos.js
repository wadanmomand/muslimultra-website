/**
 * Muslim Ultra — Cosmos 3D Engine v2 (cosmos.js)
 * High-performance, cinematic-slow 3D celestial universe built with Three.js.
 * Features:
 *  - Procedural PBR golden crescent ('crescent')
 *  - Celestial glowing lantern ('lantern')
 *  - Pure cosmic stardust ('quiet')
 *  - 3D CatmullRom camera rail with smooth scroll progress (0..1)
 *  - Mouse parallax & mobile-first auto-degradation (<=40% particles on mobile)
 *  - No-WebGL & prefers-reduced-motion fallbacks
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Cosmos = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Check WebGL support
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Create radial star point texture
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 223, 115, 0.85)');
    gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.35)');
    gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Create glowing procedural crescent geometry
  function createCrescentGeometry() {
    const shape = new THREE.Shape();
    const R = 6.0;
    const r = 5.2;
    const d = 2.3; // inner offset
    const segments = 48;

    const startAngle = -Math.PI * 0.72;
    const endAngle = Math.PI * 0.72;

    shape.moveTo(Math.cos(startAngle) * R, Math.sin(startAngle) * R);
    for (let i = 1; i <= segments; i++) {
      const theta = startAngle + (endAngle - startAngle) * (i / segments);
      shape.lineTo(Math.cos(theta) * R, Math.sin(theta) * R);
    }

    const innerStart = Math.PI * 0.62;
    const innerEnd = -Math.PI * 0.62;
    for (let i = 0; i <= segments; i++) {
      const theta = innerStart + (innerEnd - innerStart) * (i / segments);
      shape.lineTo(d + Math.cos(theta) * r, Math.sin(theta) * r);
    }

    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      steps: 2,
      depth: 1.2,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.45,
      bevelSegments: 5
    });
  }

  // Create 3D stylized celestial lantern
  function createLanternGroup() {
    const group = new THREE.Group();

    // Gold frame material
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x3d2806,
      emissiveIntensity: 0.4
    });

    // Warm glowing core material
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffe58f,
      transparent: true,
      opacity: 0.95
    });

    // Lantern top cap
    const topGeom = new THREE.ConeGeometry(2.4, 2.0, 6);
    const topMesh = new THREE.Mesh(topGeom, goldMat);
    topMesh.position.y = 3.6;
    group.add(topMesh);

    // Lantern ring hook
    const ringGeom = new THREE.TorusGeometry(0.8, 0.12, 12, 24);
    const ringMesh = new THREE.Mesh(ringGeom, goldMat);
    ringMesh.position.y = 5.0;
    group.add(ringMesh);

    // Lantern central glowing core
    const coreGeom = new THREE.CylinderGeometry(1.4, 1.8, 4.2, 6);
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.position.y = 1.0;
    group.add(coreMesh);

    // Lantern bottom base
    const baseGeom = new THREE.CylinderGeometry(1.9, 1.3, 1.2, 6);
    const baseMesh = new THREE.Mesh(baseGeom, goldMat);
    baseMesh.position.y = -1.6;
    group.add(baseMesh);

    // Light source inside lantern
    const lanternLight = new THREE.PointLight(0xffdf73, 4.0, 30, 1.5);
    lanternLight.position.y = 1.0;
    group.add(lanternLight);

    group.scale.set(0.9, 0.9, 0.9);
    return group;
  }

  // Engine state
  let state = null;

  const Cosmos = {
    init: function (containerOrId, options) {
      if (state) {
        this.destroy();
      }

      const container = typeof containerOrId === 'string'
        ? document.getElementById(containerOrId)
        : containerOrId;

      if (!container) {
        console.warn('[Cosmos] Container element not found.');
        return null;
      }

      if (!window.THREE || !isWebGLAvailable()) {
        console.info('[Cosmos] Three.js or WebGL unavailable. Applying non-JS fallback.');
        container.classList.add('cosmos-fallback');
        return null;
      }

      const opts = Object.assign({
        density: 'medium', // 'high', 'medium', 'low' or number
        accent: 'crescent', // 'crescent', 'lantern', 'quiet'
        speed: 1.0,         // cinematic-slow base speed multiplier
        interactive: true
      }, options || {});

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < 768;

      // Determine particle count (Mobile-first: <= 40% of desktop)
      let baseParticles = 1400;
      if (opts.density === 'high') baseParticles = 2000;
      else if (opts.density === 'low') baseParticles = 700;
      else if (typeof opts.density === 'number') baseParticles = opts.density;

      const particleCount = isMobile ? Math.floor(baseParticles * 0.35) : baseParticles;

      // Scene, Camera, Renderer
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x030712, 0.0016);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile && window.devicePixelRatio < 2,
        powerPreference: 'high-performance'
      });

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x111c2e, 2.0);
      scene.add(ambientLight);

      const keyGoldLight = new THREE.DirectionalLight(0xffdf73, 2.8);
      keyGoldLight.position.set(25, 30, 20);
      scene.add(keyGoldLight);

      const rimBlueLight = new THREE.DirectionalLight(0x3a6ea5, 1.8);
      rimBlueLight.position.set(-25, -15, -15);
      scene.add(rimBlueLight);

      // 1. Starfield Particles
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(particleCount * 3);
      const starColors = new Float32Array(particleCount * 3);
      const starSizes = new Float32Array(particleCount);

      const palette = [
        new THREE.Color(0xffdf73), // Gold
        new THREE.Color(0xd4af37), // Celestial Gold
        new THREE.Color(0xffffff), // Pure White
        new THREE.Color(0x7eb6ff), // Sky Blue
        new THREE.Color(0xf5e6a3)  // Warm Sand
      ];

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 140;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 100;
        starPositions[i3 + 2] = (Math.random() - 0.5) * 80;

        const col = palette[Math.floor(Math.random() * palette.length)];
        starColors[i3] = col.r;
        starColors[i3 + 1] = col.g;
        starColors[i3 + 2] = col.b;

        starSizes[i] = Math.random() * 2.2 + 0.6;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

      const starTexture = createStarTexture();
      const starMaterial = new THREE.PointsMaterial({
        size: 0.9,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        map: starTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const starPoints = new THREE.Points(starGeo, starMaterial);
      scene.add(starPoints);

      // 2. Accent Object (Crescent, Lantern, or Quiet)
      const accentGroup = new THREE.Group();
      scene.add(accentGroup);

      let accentMesh = null;
      if (opts.accent === 'crescent') {
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          roughness: 0.2,
          metalness: 0.88,
          emissive: 0x3d2806,
          emissiveIntensity: 0.35
        });
        const geom = createCrescentGeometry();
        geom.center();
        accentMesh = new THREE.Mesh(geom, goldMat);
        accentMesh.position.set(isMobile ? 0 : 12, isMobile ? 3 : 2, 0);
        accentMesh.scale.set(isMobile ? 0.7 : 1.1, isMobile ? 0.7 : 1.1, isMobile ? 0.7 : 1.1);
        accentGroup.add(accentMesh);
      } else if (opts.accent === 'lantern') {
        accentMesh = createLanternGroup();
        accentMesh.position.set(isMobile ? 0 : 10, isMobile ? 2 : 1.5, 2);
        accentGroup.add(accentMesh);
      }

      // 3. 3D Camera Rail (CatmullRom Curve) for Smooth Scroll-Driven Glide
      const railPoints = [
        new THREE.Vector3(0, 0, 36),     // Chapter 1: Initial Hero View
        new THREE.Vector3(6, -3, 28),    // Chapter 2: Glide Right & Down
        new THREE.Vector3(-6, 3, 22),    // Chapter 3: Sweep Left & Up
        new THREE.Vector3(0, -6, 16)     // Chapter 4: Gentle Final Overview
      ];

      const lookAtPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2, -1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(0, -2, -10)
      ];

      const railCurve = new THREE.CatmullRomCurve3(railPoints);
      const lookAtCurve = new THREE.CatmullRomCurve3(lookAtPoints);

      // Initial Camera Position
      camera.position.copy(railCurve.getPointAt(0));
      camera.lookAt(lookAtCurve.getPointAt(0));

      // State tracker
      state = {
        container,
        scene,
        camera,
        renderer,
        opts,
        starPoints,
        accentGroup,
        accentMesh,
        railCurve,
        lookAtCurve,
        progress: 0,
        targetProgress: 0,
        mouseX: 0,
        mouseY: 0,
        targetMouseX: 0,
        targetMouseY: 0,
        prefersReducedMotion,
        isMobile,
        animId: null,
        clock: new THREE.Clock()
      };

      // Mouse Parallax Listener
      if (opts.interactive && !prefersReducedMotion) {
        state.onMouseMove = function (e) {
          state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', state.onMouseMove, { passive: true });
      }

      // Resize Listener
      state.onResize = function () {
        if (!state) return;
        const w = state.container.clientWidth || window.innerWidth;
        const h = state.container.clientHeight || window.innerHeight;
        state.camera.aspect = w / h;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(w, h);

        const mobileNow = window.innerWidth < 768;
        if (state.accentMesh) {
          if (mobileNow) {
            state.accentMesh.position.set(0, 3, -2);
            state.accentMesh.scale.set(0.65, 0.65, 0.65);
          } else {
            state.accentMesh.position.set(12, 2, 0);
            state.accentMesh.scale.set(1.1, 1.1, 1.1);
          }
        }
      };
      window.addEventListener('resize', state.onResize, { passive: true });

      // Render Loop (Cinematic-slow)
      function render() {
        if (!state) return;
        state.animId = requestAnimationFrame(render);

        if (document.hidden) return;

        const dt = state.clock.getDelta();
        const elapsed = state.clock.getElapsedTime();
        const speed = (state.opts.speed || 1.0) * 0.4; // Controlled slow cinematic pace

        // 1. Smoothly interpolate scroll rail progress
        state.progress += (state.targetProgress - state.progress) * 0.08;
        const clampedP = Math.max(0, Math.min(1, state.progress));

        const baseCamPos = state.railCurve.getPointAt(clampedP);
        const baseLookAt = state.lookAtCurve.getPointAt(clampedP);

        // 2. Mouse Parallax interpolation
        if (!state.prefersReducedMotion) {
          state.targetMouseX += (state.mouseX - state.targetMouseX) * 0.05;
          state.targetMouseY += (state.mouseY - state.targetMouseY) * 0.05;

          // Camera glide + gentle parallax
          state.camera.position.x = baseCamPos.x + state.targetMouseX * 1.8;
          state.camera.position.y = baseCamPos.y - state.targetMouseY * 1.4;
          state.camera.position.z = baseCamPos.z;
          state.camera.lookAt(baseLookAt.x + state.targetMouseX * 0.5, baseLookAt.y - state.targetMouseY * 0.4, baseLookAt.z);

          // Accent floating levitation & gentle rotation
          if (state.accentMesh) {
            state.accentMesh.rotation.y = -0.3 + Math.sin(elapsed * speed) * 0.15 + state.targetMouseX * 0.2;
            state.accentMesh.rotation.x = 0.15 + Math.cos(elapsed * speed * 0.8) * 0.1 - state.targetMouseY * 0.15;
            state.accentMesh.position.y += Math.sin(elapsed * speed * 1.5) * 0.008;
          }

          // Gentle starfield drift
          state.starPoints.rotation.y = elapsed * 0.008;
          state.starPoints.rotation.x = Math.sin(elapsed * 0.005) * 0.015;
        } else {
          // Static frame for reduced motion
          state.camera.position.copy(baseCamPos);
          state.camera.lookAt(baseLookAt);
        }

        state.renderer.render(state.scene, state.camera);
      }

      render();
      return this;
    },

    setProgress: function (p) {
      if (state) {
        state.targetProgress = Math.max(0, Math.min(1, p));
      }
    },

    destroy: function () {
      if (!state) return;
      if (state.animId) cancelAnimationFrame(state.animId);
      if (state.onMouseMove) window.removeEventListener('mousemove', state.onMouseMove);
      if (state.onResize) window.removeEventListener('resize', state.onResize);

      if (state.renderer) {
        state.renderer.dispose();
        if (state.renderer.domElement && state.renderer.domElement.parentNode) {
          state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
        }
      }
      state = null;
    }
  };

  return Cosmos;
}));
