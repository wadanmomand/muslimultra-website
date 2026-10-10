/**
 * Muslim Ultra — Celestial 3D Hero Engine (Three.js)
 * High-performance 3D cosmic starfield + procedural glowing golden crescent moon
 * Fully responsive, mouse-parallax enabled, with graceful WebGL fallback.
 */

(function () {
  'use strict';

  // Check if WebGL is supported
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvasContainer = document.getElementById('hero-canvas-container');
  if (!canvasContainer || !window.THREE || !isWebGLAvailable()) {
    console.info('Three.js or WebGL not available / Container missing. Using CSS fallback.');
    if (canvasContainer) {
      canvasContainer.classList.add('canvas-fallback');
    }
    return;
  }

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060e1a, 0.0018);

  const width = canvasContainer.clientWidth || window.innerWidth;
  const height = canvasContainer.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 36);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance'
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  canvasContainer.appendChild(renderer.domElement);

  // Group to hold all rotating celestial objects
  const celestialGroup = new THREE.Group();
  scene.add(celestialGroup);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a2638, 1.8);
  scene.add(ambientLight);

  const keyGoldLight = new THREE.DirectionalLight(0xffdf73, 2.8);
  keyGoldLight.position.set(20, 25, 20);
  scene.add(keyGoldLight);

  const rimBlueLight = new THREE.DirectionalLight(0x4a7bb0, 2.0);
  rimBlueLight.position.set(-20, -10, -15);
  scene.add(rimBlueLight);

  const warmPointLight = new THREE.PointLight(0xd4af37, 3.5, 45, 1.2);
  warmPointLight.position.set(5, 5, 10);
  scene.add(warmPointLight);

  // 1. Procedural 3D Golden Crescent Moon Mesh
  function createCrescentGeometry() {
    const shape = new THREE.Shape();
    // Outer arc of crescent
    const R = 6.2;
    const r = 5.4;
    const d = 2.4; // offset for inner arc

    // Draw outer circle arc (from -Math.PI*0.7 to Math.PI*0.7)
    const startAngle = -Math.PI * 0.72;
    const endAngle = Math.PI * 0.72;
    const segments = 48;

    shape.moveTo(Math.cos(startAngle) * R, Math.sin(startAngle) * R);
    for (let i = 1; i <= segments; i++) {
      const theta = startAngle + (endAngle - startAngle) * (i / segments);
      shape.lineTo(Math.cos(theta) * R, Math.sin(theta) * R);
    }

    // Draw inner circle arc backwards
    const innerStart = Math.PI * 0.62;
    const innerEnd = -Math.PI * 0.62;
    for (let i = 0; i <= segments; i++) {
      const theta = innerStart + (innerEnd - innerStart) * (i / segments);
      shape.lineTo(d + Math.cos(theta) * r, Math.sin(theta) * r);
    }

    shape.closePath();

    const extrudeSettings = {
      steps: 2,
      depth: 1.4,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.5,
      bevelOffset: 0,
      bevelSegments: 6
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }

  // Golden Metallic PBR Material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.22,
    metalness: 0.88,
    emissive: 0x3d2806,
    emissiveIntensity: 0.35,
    flatShading: false
  });

  const crescentMesh = new THREE.Mesh(createCrescentGeometry(), goldMaterial);
  // Position the crescent slightly to top-right on desktop, centered on mobile
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    crescentMesh.position.set(0, 4, -4);
    crescentMesh.scale.set(0.65, 0.65, 0.65);
  } else {
    crescentMesh.position.set(13, 3.5, 0);
    crescentMesh.scale.set(1.15, 1.15, 1.15);
  }
  crescentMesh.rotation.set(0.2, -0.35, 0.15);
  celestialGroup.add(crescentMesh);

  // 2. Glowing Halo Ring around Crescent
  const ringGeom = new THREE.TorusGeometry(8.5, 0.08, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffdf73,
    transparent: true,
    opacity: 0.45
  });
  const haloRing = new THREE.Mesh(ringGeom, ringMat);
  haloRing.position.copy(crescentMesh.position);
  haloRing.rotation.x = Math.PI / 2.8;
  celestialGroup.add(haloRing);

  // 3. Deep Cosmic Starfield & Stardust Particles
  const isSmallScreen = window.innerWidth < 768;
  const particleCount = isSmallScreen ? 700 : 1600;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(particleCount * 3);
  const starColors = new Float32Array(particleCount * 3);
  const starSizes = new Float32Array(particleCount);

  // Color options: warm gold, radiant white, celestial blue
  const colorPalette = [
    new THREE.Color(0xffdf73), // Gold light
    new THREE.Color(0xd4af37), // Celestial Gold
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0x7eb6ff), // Celestial blue
    new THREE.Color(0xf5e6a3)  // Warm champagne
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Spread in a large volume around camera
    starPositions[i3] = (Math.random() - 0.5) * 120;
    starPositions[i3 + 1] = (Math.random() - 0.5) * 80;
    starPositions[i3 + 2] = (Math.random() - 0.5) * 60;

    const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    starColors[i3] = chosenColor.r;
    starColors[i3 + 1] = chosenColor.g;
    starColors[i3 + 2] = chosenColor.b;

    starSizes[i] = Math.random() * 2.5 + 0.6;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

  // Circular glow point texture
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 223, 115, 0.8)');
    gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.3)');
    gradient.addColorStop(1, 'rgba(6, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  const starMaterial = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    map: createStarTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const starPoints = new THREE.Points(starGeo, starMaterial);
  scene.add(starPoints);

  // 4. Floating 8-Point Islamic Star Dust
  const sacredPointsCount = 28;
  const sacredGeo = new THREE.BufferGeometry();
  const sacredPos = new Float32Array(sacredPointsCount * 3);
  for (let i = 0; i < sacredPointsCount; i++) {
    const i3 = i * 3;
    const angle = (i / sacredPointsCount) * Math.PI * 2;
    const radius = 9 + Math.random() * 8;
    sacredPos[i3] = (isMobile ? 0 : 13) + Math.cos(angle) * radius;
    sacredPos[i3 + 1] = 3.5 + Math.sin(angle) * (radius * 0.6);
    sacredPos[i3 + 2] = (Math.random() - 0.5) * 8;
  }
  sacredGeo.setAttribute('position', new THREE.BufferAttribute(sacredPos, 3));
  const sacredMat = new THREE.PointsMaterial({
    size: 2.2,
    color: 0xffdf73,
    transparent: true,
    opacity: 0.9,
    map: createStarTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sacredPoints = new THREE.Points(sacredGeo, sacredMat);
  celestialGroup.add(sacredPoints);

  // Mouse Parallax tracking
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  if (!prefersReducedMotion) {
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // Responsive Resize
  function onWindowResize() {
    const newWidth = canvasContainer.clientWidth || window.innerWidth;
    const newHeight = canvasContainer.clientHeight || window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);

    const mobileNow = window.innerWidth < 768;
    if (mobileNow) {
      crescentMesh.position.set(0, 4, -4);
      crescentMesh.scale.set(0.65, 0.65, 0.65);
    } else {
      crescentMesh.position.set(13, 3.5, 0);
      crescentMesh.scale.set(1.15, 1.15, 1.15);
    }
    haloRing.position.copy(crescentMesh.position);
  }

  window.addEventListener('resize', onWindowResize, { passive: true });

  // Animation Loop
  let clock = new THREE.Clock();
  let animationFrameId;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Stop rendering when page is hidden
    if (document.hidden) return;

    const elapsedTime = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Gentle crescent rotation and levitation
      crescentMesh.rotation.y = -0.35 + Math.sin(elapsedTime * 0.45) * 0.18 + targetX * 0.25;
      crescentMesh.rotation.x = 0.2 + Math.cos(elapsedTime * 0.35) * 0.12 - targetY * 0.2;
      crescentMesh.rotation.z = 0.15 + Math.sin(elapsedTime * 0.25) * 0.08;
      crescentMesh.position.y = (isMobile ? 4 : 3.5) + Math.sin(elapsedTime * 0.8) * 0.45;

      haloRing.position.y = crescentMesh.position.y;
      haloRing.rotation.z = elapsedTime * 0.15;

      // Orbiting sacred points
      sacredPoints.rotation.z = -elapsedTime * 0.08;

      // Subtle starfield slow drift
      starPoints.rotation.y = elapsedTime * 0.015;
      starPoints.rotation.x = Math.sin(elapsedTime * 0.01) * 0.02;

      // Camera parallax
      camera.position.x = targetX * 2.2;
      camera.position.y = -targetY * 1.8;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  animate();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
  });
})();
