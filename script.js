/* global THREE */

const reveals = document.querySelectorAll(".reveal");
const heroBg = document.querySelector(".hero-bg");
const heroSection = document.querySelector(".hero");
const heroFeatures = document.querySelector(".hero-features");
const storyLines = document.querySelectorAll(".story-line");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hasThree = typeof THREE !== "undefined";

const supportsWebGL = (() => {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch (error) {
    return false;
  }
})();

const getQualityTier = () => {
  const width = window.innerWidth;
  if (width <= 480) {
    return "low";
  }
  if (width <= 768) {
    return "medium";
  }
  return "high";
};

const setRendererColorSpace = (renderer) => {
  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
};

const createRenderer = (canvas) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  setRendererColorSpace(renderer);
  return renderer;
};

const resizeRendererToDisplaySize = (renderer, camera) => {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth || 1;
  const height = canvas.clientHeight || 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  if (renderer.getPixelRatio() !== dpr) {
    renderer.setPixelRatio(dpr);
  }
  const displayWidth = Math.floor(width * dpr);
  const displayHeight = Math.floor(height * dpr);
  const needsResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
  if (needsResize) {
    renderer.setSize(width, height, false);
    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  return needsResize;
};

const createGlowTexture = (innerColor, outerColor) => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, innerColor || "rgba(89, 247, 255, 0.85)");
  gradient.addColorStop(0.45, outerColor || "rgba(89, 247, 255, 0.25)");
  gradient.addColorStop(1, "rgba(89, 247, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  if (texture.colorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace;
  } else if (texture.encoding) {
    texture.encoding = THREE.sRGBEncoding;
  }
  return texture;
};

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-loaded");
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number(entry.target.dataset.delay || 0);
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  }
);

reveals.forEach((element) => revealObserver.observe(element));

const activateStoryLine = () => {
  if (storyLines.length === 0) {
    return;
  }

  const viewportCenter = window.innerHeight / 2;
  const maxDistance = window.innerHeight * 0.7;

  storyLines.forEach((line) => {
    const rect = line.getBoundingClientRect();
    const lineCenter = rect.top + rect.height / 2;
    const distance = lineCenter - viewportCenter;
    const normalized = Math.min(Math.abs(distance) / maxDistance, 1);
    const opacity = 1 - normalized * 0.7;
    const shift = clamp(distance * 0.07, -50, 50);
    const rotate = clamp((distance / maxDistance) * 8, -8, 8);
    const scale = 1 - normalized * 0.05;
    const depth = clamp(-normalized * 60, -60, 0);

    line.style.setProperty("--line-opacity", opacity.toFixed(3));
    line.style.setProperty("--line-shift", `${shift.toFixed(2)}px`);
    line.style.setProperty("--line-rotate", `${rotate.toFixed(2)}deg`);
    line.style.setProperty("--line-scale", scale.toFixed(3));
    line.style.setProperty("--line-depth", `${depth.toFixed(2)}px`);
  });
};

const handleScroll = () => {
  const offset = window.scrollY * 0.12;
  if (heroBg) {
    heroBg.style.transform = `translateY(${offset}px)`;
  }
  activateStoryLine();
};

const ensureHeroUnlockedForViewport = () => {
  if (!heroSection) {
    return;
  }
  const heroTop = heroSection.offsetTop;
  const atHero = window.scrollY <= heroTop + 2;
  if (!atHero || !shouldGateHero()) {
    unlockHeroScroll();
    if (!atHero) {
      setHeroProgress(1);
      heroTargetProgress = 1;
      applyHeroState(2);
    }
  }
};

let isTicking = false;
const onScroll = () => {
  if (isTicking) {
    return;
  }
  isTicking = true;
  window.requestAnimationFrame(() => {
    handleScroll();
    ensureHeroUnlockedForViewport();
    isTicking = false;
  });
};

window.addEventListener("scroll", onScroll, { passive: true });
handleScroll();

const isMobileViewport = () => window.innerWidth <= 768;

const setHeroLeftShift = () => {
  if (!heroSection) {
    return;
  }
  const viewportWidth = window.innerWidth;
  heroLeftShiftPx = Math.max(viewportWidth * -0.22, -320);
  heroSection.style.setProperty("--hero-left-shift", `${heroLeftShiftPx}px`);
};

let heroProgress = 0;
let heroLocked = false;
let heroLeftShiftPx = 0;
const HERO_SCRUB_DELTA = 650;
const HERO_SCRUB_SMOOTH = 0.18;
let heroTargetProgress = 0;
let heroScrubRaf = null;

const unlockHeroScroll = () => {
  heroLocked = false;
  document.body.classList.remove("hero-locked");
  heroSection?.classList.remove("hero--locked");
};

const lockHeroScroll = () => {
  if (heroLocked) {
    return;
  }
  heroLocked = true;
  document.body.classList.add("hero-locked");
  heroSection?.classList.add("hero--locked");
};

const setHeroProgress = (value) => {
  heroProgress = clamp(value, 0, 1);
  heroSection?.style.setProperty("--hero-progress", heroProgress.toFixed(3));
  const logoProgress = clamp(heroProgress * 1.2, 0, 1);
  const featureProgress = clamp((heroProgress - 0.35) * 1.6, 0, 1);
  const logoShift = heroLeftShiftPx * logoProgress;
  const logoScale = 1 - 0.08 * logoProgress;
  const featuresShift = (1 - featureProgress) * 16;
  const featureShift = (1 - featureProgress) * 12;
  heroSection?.style.setProperty("--hero-logo-progress", logoProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-features-progress", featureProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-logo-shift", `${logoShift.toFixed(2)}px`);
  heroSection?.style.setProperty("--hero-logo-scale", logoScale.toFixed(3));
  heroSection?.style.setProperty("--hero-features-opacity", featureProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-features-shift", `${featuresShift.toFixed(2)}px`);
  heroSection?.style.setProperty("--hero-feature-shift", `${featureShift.toFixed(2)}px`);
};

const updateHeroClassesFromProgress = () => {
  if (!heroSection) {
    return;
  }
  applyHeroState(heroProgress >= 1 ? 2 : heroProgress >= 0.35 ? 1 : 0);
};

const startHeroScrubAnimation = () => {
  if (heroScrubRaf) {
    return;
  }
  const step = () => {
    const diff = heroTargetProgress - heroProgress;
    if (Math.abs(diff) < 0.001) {
      setHeroProgress(heroTargetProgress);
      updateHeroClassesFromProgress();
      heroScrubRaf = null;
      return;
    }
    heroProgress += diff * HERO_SCRUB_SMOOTH;
    setHeroProgress(heroProgress);
    updateHeroClassesFromProgress();
    heroScrubRaf = window.requestAnimationFrame(step);
  };
  heroScrubRaf = window.requestAnimationFrame(step);
};

const applyHeroState = (state) => {
  if (!heroSection) {
    return;
  }
  if (heroSection.classList.contains("hero--scrub")) {
    heroSection.classList.remove("hero--centered", "hero--logo-left", "hero--features-visible");
    return;
  }
  heroSection.classList.remove("hero--centered", "hero--logo-left", "hero--features-visible");
  if (state <= 0) {
    heroSection.classList.add("hero--centered");
  }
  if (state >= 1) {
    heroSection.classList.add("hero--logo-left");
  }
  if (state >= 2) {
    heroSection.classList.add("hero--features-visible");
  }
};

const shouldGateHero = () => {
  return !!heroSection && !prefersReducedMotion.matches && !isMobileViewport();
};

const setupHeroScrollLock = () => {
  if (!heroSection) {
    return;
  }
  if (prefersReducedMotion.matches || isMobileViewport()) {
    heroSection.classList.remove("hero--scrub");
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
    return;
  }
  heroSection.classList.add("hero--scrub");
  setHeroProgress(0);
  heroTargetProgress = 0;
  applyHeroState(0);
  unlockHeroScroll();
};

let touchStartY = 0;

const onWheel = (event) => {
  const heroTop = heroSection?.offsetTop ?? 0;
  const atHero = window.scrollY <= heroTop + 2;
  const direction = Math.sign(event.deltaY);

  if (!shouldGateHero() || !atHero) {
    unlockHeroScroll();
    return;
  }

  if (direction === 0) {
    return;
  }

  if ((direction > 0 && heroProgress >= 1) || (direction < 0 && heroProgress <= 0)) {
    unlockHeroScroll();
    return;
  }

  const delta = event.deltaY / HERO_SCRUB_DELTA;
  heroTargetProgress = clamp(heroTargetProgress + delta, 0, 1);
  startHeroScrubAnimation();
  event.preventDefault();
};

const onTouchStart = (event) => {
  if (!shouldGateHero()) {
    return;
  }
  if (event.touches && event.touches.length > 0) {
    touchStartY = event.touches[0].clientY;
  }
};

const onTouchMove = (event) => {
  const heroTop = heroSection?.offsetTop ?? 0;
  const atHero = window.scrollY <= heroTop + 2;
  if (!shouldGateHero() || !atHero) {
    unlockHeroScroll();
    return;
  }

  if (event.touches && event.touches.length > 0) {
    const currentY = event.touches[0].clientY;
    const delta = touchStartY - currentY;
    const direction = Math.sign(delta);

    if (direction === 0) {
      return;
    }

    if ((direction > 0 && heroProgress >= 1) || (direction < 0 && heroProgress <= 0)) {
      unlockHeroScroll();
      return;
    }

    const deltaProgress = (touchStartY - currentY) / HERO_SCRUB_DELTA;
    heroTargetProgress = clamp(heroTargetProgress + deltaProgress, 0, 1);
    startHeroScrubAnimation();
    touchStartY = currentY;
    event.preventDefault();
  }
};

setHeroLeftShift();
setupHeroScrollLock();

window.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("touchstart", onTouchStart, { passive: true });
window.addEventListener("touchmove", onTouchMove, { passive: false });

window.addEventListener("resize", () => {
  setHeroLeftShift();
  if (!shouldGateHero()) {
    heroSection?.classList.remove("hero--scrub");
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
  } else {
    heroSection?.classList.add("hero--scrub");
    unlockHeroScroll();
  }
});

const createHeroScene = (canvas, section) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 6, 18);

  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    40
  );
  camera.position.set(0, 0.6, 8);

  const renderer = createRenderer(canvas);

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1426,
    metalness: 0.5,
    roughness: 0.25,
    emissive: 0x1a4d5d,
    emissiveIntensity: 0.35,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 48), coreMaterial);
  coreGroup.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.06, 20, 100),
    new THREE.MeshStandardMaterial({
      color: 0x0b1c2b,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55,
    })
  );
  ring.rotation.x = Math.PI / 2.3;
  ring.rotation.z = Math.PI / 5;
  coreGroup.add(ring);

  const ringBack = new THREE.Mesh(
    ring.geometry,
    new THREE.MeshBasicMaterial({
      color: 0x0f2835,
      transparent: true,
      opacity: 0.16,
    })
  );
  ringBack.rotation.x = ring.rotation.x;
  ringBack.rotation.z = ring.rotation.z;
  ringBack.position.z = -0.12;
  ringBack.scale.setScalar(1.03);
  coreGroup.add(ringBack);

  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glowSprite.scale.set(4.6, 4.6, 1);
  coreGroup.add(glowSprite);

  const ambient = new THREE.AmbientLight(0x87a5c9, 0.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.9);
  keyLight.position.set(2, 2.2, 4);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1.1, 12);
  rim.position.set(-2.2, 0.8, 2.4);
  scene.add(rim);

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();

  const renderFrame = (staticFrame) => {
    resizeRendererToDisplaySize(renderer, camera);
    const elapsed = staticFrame ? 0 : clock.getElapsedTime();
    const drift = 0;

    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const scrollSpan = Math.max(sectionHeight - window.innerHeight, window.innerHeight * 0.9);
    const scrollFactor = clamp((window.scrollY - sectionTop) / scrollSpan, 0, 1);

    const ringSpeed = (Math.PI * 2) / 18;
    coreGroup.rotation.y = scrollFactor * 0.12;
    coreGroup.rotation.x = Math.PI / 18 + scrollFactor * 0.2;
    ring.rotation.z = elapsed * ringSpeed;

    const zoomBase = 7.2;
    const zoomRange = 2.4;
    camera.position.z = zoomBase + scrollFactor * zoomRange;
    camera.position.y = 0.6 + drift * 0.15;
    camera.lookAt(0, 0, 0);

    const scale = 1 - scrollFactor * 0.08;
    coreGroup.scale.setScalar(scale);

    renderer.render(scene, camera);
  };

  const animate = () => {
    if (!running) {
      return;
    }
    renderFrame(false);
    raf = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running || prefersReducedMotion.matches) {
      return;
    }
    running = true;
    clock.start();
    animate();
  };

  const stop = () => {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const renderStatic = () => renderFrame(true);

  const onResize = () => resizeRendererToDisplaySize(renderer, camera);

  return { start, stop, renderStatic, onResize };
};

const createBridgeScene = (canvas) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 4, 16);

  const camera = new THREE.PerspectiveCamera(
    40,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    30
  );
  camera.position.set(0, 0.6, 6);

  const renderer = createRenderer(canvas);

  const quality = getQualityTier();
  const tunnelLength = 6.2;
  const tunnelRadius = quality === "low" ? 0.42 : 0.5;
  const tunnelSegments = quality === "low" ? 20 : 32;

  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(
      tunnelRadius,
      tunnelRadius,
      tunnelLength,
      tunnelSegments,
      1,
      true
    ),
    new THREE.MeshStandardMaterial({
      color: 0x0b1626,
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 0.28,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.08,
      side: THREE.DoubleSide,
    })
  );
  tunnel.rotation.z = Math.PI / 2;
  scene.add(tunnel);

  const innerGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(
      tunnelRadius * 0.92,
      tunnelRadius * 0.92,
      tunnelLength * 0.98,
      tunnelSegments,
      1,
      true
    ),
    new THREE.MeshBasicMaterial({
      color: 0x59f7ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  innerGlow.rotation.z = Math.PI / 2;
  scene.add(innerGlow);

  const boundaryRing = new THREE.Mesh(
    new THREE.TorusGeometry(tunnelRadius * 1.05, 0.03, 16, 80),
    new THREE.MeshStandardMaterial({
      color: 0x0a1926,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
    })
  );
  boundaryRing.rotation.y = Math.PI / 2;
  scene.add(boundaryRing);

  const pulseSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  pulseSprite.scale.set(1.4, 1.4, 1);
  scene.add(pulseSprite);

  const capsuleRadius = quality === "low" ? 0.14 : 0.18;
  const capsuleLength = quality === "low" ? 0.5 : 0.65;
  const capsuleGeometry = THREE.CapsuleGeometry
    ? new THREE.CapsuleGeometry(capsuleRadius, capsuleLength, 8, 16)
    : new THREE.CylinderGeometry(capsuleRadius, capsuleRadius, capsuleLength, 16, 1, true);

  const plainMaterial = new THREE.MeshStandardMaterial({
    color: 0x13202a,
    emissive: 0x7ad0ff,
    emissiveIntensity: 0.22,
    roughness: 0.45,
    metalness: 0.1,
    transparent: true,
    opacity: 1,
  });

  const cipherMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1a26,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0,
  });

  const packetGroup = new THREE.Group();
  const plainCapsule = new THREE.Mesh(capsuleGeometry, plainMaterial);
  const cipherCapsule = new THREE.Mesh(capsuleGeometry, cipherMaterial);
  plainCapsule.rotation.z = Math.PI / 2;
  cipherCapsule.rotation.z = Math.PI / 2;
  packetGroup.add(plainCapsule, cipherCapsule);
  scene.add(packetGroup);

  const noiseParticles = new THREE.BufferGeometry();
  const noiseCount = quality === "low" ? 30 : 60;
  const noisePositions = new Float32Array(noiseCount * 3);
  for (let i = 0; i < noiseCount; i += 1) {
    noisePositions[i * 3] = (Math.random() - 0.5) * 0.4;
    noisePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
    noisePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  noiseParticles.setAttribute("position", new THREE.BufferAttribute(noisePositions, 3));
  const noiseMaterial = new THREE.PointsMaterial({
    color: 0x9fe7ff,
    size: quality === "low" ? 0.02 : 0.025,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const noisePoints = new THREE.Points(noiseParticles, noiseMaterial);
  plainCapsule.add(noisePoints);

  const loader = new THREE.TextureLoader();
  const lockTexture = loader.load("lock-removebg-preview.png");
  const hackerTexture = loader.load("hacker-removebg-preview.png");
  if (lockTexture.colorSpace) {
    lockTexture.colorSpace = THREE.SRGBColorSpace;
  } else if (lockTexture.encoding) {
    lockTexture.encoding = THREE.sRGBEncoding;
  }
  if (hackerTexture.colorSpace) {
    hackerTexture.colorSpace = THREE.SRGBColorSpace;
  } else if (hackerTexture.encoding) {
    hackerTexture.encoding = THREE.sRGBEncoding;
  }

  const lockSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lockTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  lockSprite.scale.set(0.45, 0.45, 1);
  lockSprite.position.set(0, 0.28, 0.1);
  cipherCapsule.add(lockSprite);

  const hackerSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: hackerTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  hackerSprite.scale.set(1.4, 1.4, 1);
  hackerSprite.position.set(-0.6, -1.05, -0.9);
  scene.add(hackerSprite);

  const glitchSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture("rgba(89, 247, 255, 0.6)", "rgba(89, 247, 255, 0.2)"),
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glitchSprite.scale.set(0.9, 0.9, 1);
  glitchSprite.position.set(-0.2, -0.5, -0.2);
  scene.add(glitchSprite);

  const ambient = new THREE.AmbientLight(0x8aa7c2, 0.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.8);
  keyLight.position.set(2, 2, 3.5);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1, 8);
  rim.position.set(-2, 0.4, 2);
  scene.add(rim);

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();

  const renderFrame = (staticFrame) => {
    resizeRendererToDisplaySize(renderer, camera);

    const elapsed = staticFrame ? 0 : clock.getElapsedTime();
    const cycle = 6;
    const t = (elapsed % cycle) / cycle;

    const easeInOut = (value) => -(Math.cos(Math.PI * value) - 1) / 2;
    const eased = t < 0.5
      ? easeInOut(t * 2) * 0.5
      : 0.5 + easeInOut((t - 0.5) * 2) * 0.5;

    const x = (-tunnelLength / 2 + 0.5) + (tunnelLength - 1) * eased;
    packetGroup.position.set(x, Math.sin(elapsed * 1.2) * 0.05, 0);

    const encryptPhase = clamp((t - 0.46) / 0.1, 0, 1);
    plainMaterial.opacity = 1 - encryptPhase;
    cipherMaterial.opacity = encryptPhase;

    const flicker = 0.4 + Math.sin(elapsed * 9) * 0.15;
    plainMaterial.emissiveIntensity = 0.2 + flicker * 0.4;
    noiseMaterial.opacity = 0.35 + flicker * 0.25;

    const pulse = Math.exp(-Math.pow((t - 0.5) * 10, 2));
    boundaryRing.material.emissiveIntensity = 0.3 + pulse * 0.9;
    boundaryRing.scale.setScalar(1 + pulse * 0.2);
    pulseSprite.material.opacity = 0.15 + pulse * 0.65;

    const peek = clamp((t - 0.1) / 0.2, 0, 1) * (1 - clamp((t - 0.55) / 0.2, 0, 1));
    hackerSprite.material.opacity = 0.25 + peek * 0.55;

    const glitchPhase = clamp((t - 0.55) / 0.15, 0, 1);
    glitchSprite.material.opacity =
      glitchPhase * (0.2 + Math.abs(Math.sin(elapsed * 16)) * 0.6);

    camera.position.z = 6.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  const animate = () => {
    if (!running) {
      return;
    }
    renderFrame(false);
    raf = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running || prefersReducedMotion.matches) {
      return;
    }
    running = true;
    clock.start();
    animate();
  };

  const stop = () => {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const renderStatic = () => renderFrame(true);

  const onResize = () => resizeRendererToDisplaySize(renderer, camera);

  return { start, stop, renderStatic, onResize };
};

const createNetworkScene = (canvas, onHover) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 5, 16);

  const camera = new THREE.PerspectiveCamera(
    42,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    40
  );
  camera.position.set(0, 1.3, 6.4);

  const renderer = createRenderer(canvas);

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1525,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.25,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 32), coreMaterial);
  base.position.y = -0.1;
  coreGroup.add(base);

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.9, 32), coreMaterial);
  tower.position.y = 0.55;
  coreGroup.add(tower);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x0d1c2c,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    })
  );
  screen.position.set(0, 0.6, 0.38);
  coreGroup.add(screen);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.03, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0x0a1a28,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5,
    })
  );
  ring.rotation.x = Math.PI / 2;
  coreGroup.add(ring);

  const ambient = new THREE.AmbientLight(0x8da7c4, 0.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.9);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1.1, 10);
  rim.position.set(-3, 1, 2);
  scene.add(rim);

  const quality = getQualityTier();
  const nodeCount = 6;
  const nodes = [];
  const arcs = [];
  const telemetryDots = [];
  const radius = 2.6;
  const dotTexture = createGlowTexture();

  for (let i = 0; i < nodeCount; i += 1) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const target = new THREE.Vector3(
      Math.cos(angle) * radius,
      (i % 2 === 0 ? 0.35 : -0.15),
      Math.sin(angle) * radius * 0.6
    );

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(quality === "low" ? 0.16 : 0.2, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0d1a28,
        emissive: 0x59f7ff,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.2,
      })
    );

    node.userData = {
      target,
      label: `Sensor Node ${i + 1}`,
      status: "Encrypted uplink",
      crypto: "LWC / AEAD",
    };
    nodes.push(node);
    scene.add(node);

    const mid = target.clone().multiplyScalar(0.5);
    mid.y += 0.9;
    const curve = new THREE.CatmullRomCurve3([
      target,
      mid,
      new THREE.Vector3(0, 0, 0),
    ]);

    const points = curve.getPoints(60);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x59f7ff,
      dashSize: 0.08,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.35,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.geometry.setDrawRange(0, 0);
    arcs.push({ line, curve, pointsCount: points.length });
    scene.add(line);

    const dot = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: dotTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    dot.scale.set(0.18, 0.18, 1);
    dot.userData = {
      progress: Math.random(),
      speed: 0.15 + Math.random() * 0.12,
      curve,
    };
    telemetryDots.push(dot);
    scene.add(dot);
  }

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();
  let introStart = null;
  let hasIntroduced = false;

  const renderFrame = (staticFrame) => {
    resizeRendererToDisplaySize(renderer, camera);

    const delta = staticFrame ? 0 : clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (!hasIntroduced) {
      if (introStart === null) {
        introStart = elapsed;
      }
      const progress = clamp((elapsed - introStart) / 1.8, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      nodes.forEach((node) => {
        const target = node.userData.target;
        node.position.lerpVectors(
          new THREE.Vector3(0, -0.6, -2.2),
          target,
          eased
        );
      });

      arcs.forEach(({ line, pointsCount }) => {
        line.geometry.setDrawRange(0, Math.floor(pointsCount * eased));
        line.material.opacity = 0.15 + eased * 0.35;
      });

      if (progress >= 1) {
        hasIntroduced = true;
      }
    } else {
      arcs.forEach(({ line }) => {
        line.material.dashOffset = -elapsed * 0.6;
      });
    }

    telemetryDots.forEach((dot) => {
      dot.userData.progress += dot.userData.speed * delta;
      if (dot.userData.progress > 1) {
        dot.userData.progress = 0;
      }
      const point = dot.userData.curve.getPointAt(dot.userData.progress);
      dot.position.copy(point);
    });

    const pulse = 1 + Math.sin(elapsed * 1.8) * 0.05;
    ring.scale.setScalar(pulse);
    ring.material.opacity = 0.35 + Math.abs(Math.sin(elapsed * 1.2)) * 0.25;

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };

  const animate = () => {
    if (!running) {
      return;
    }
    renderFrame(false);
    raf = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running || prefersReducedMotion.matches) {
      return;
    }
    running = true;
    clock.start();
    animate();
  };

  const stop = () => {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const renderStatic = () => renderFrame(true);

  const onResize = () => resizeRendererToDisplaySize(renderer, camera);

  let raycaster = null;
  let pointer = null;

  const handlePointerMove = (event) => {
    if (!onHover) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodes, false);
    if (hits.length > 0) {
      const node = hits[0].object;
      onHover({
        name: node.userData.label,
        status: node.userData.status,
        crypto: node.userData.crypto,
        x: event.clientX,
        y: event.clientY,
      });
    } else {
      onHover(null);
    }
  };

  const handlePointerLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  if (onHover) {
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
  }

  return { start, stop, renderStatic, onResize };
};

const getTooltipController = () => {
  const tooltip = document.querySelector(".network-tooltip");
  if (!tooltip) {
    return null;
  }
  return (payload) => {
    if (!payload) {
      tooltip.classList.remove("is-visible");
      return;
    }
    const container = tooltip.parentElement;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const x = payload.x - rect.left + 12;
    const y = payload.y - rect.top + 12;
    tooltip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    tooltip.innerHTML = `
      <strong>${payload.name}</strong>
      <div>${payload.status}</div>
      <div>${payload.crypto}</div>
    `;
    tooltip.classList.add("is-visible");
  };
};

const enableHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const tooltipController = enableHover ? getTooltipController() : null;

const sceneConfigs = [
  {
    key: "hero",
    section: document.querySelector(".hero"),
    canvas: document.getElementById("hero-canvas"),
    container: document.querySelector(".hero-3d"),
    init: (canvas, section) => createHeroScene(canvas, section),
  },
  {
    key: "bridge",
    section: document.querySelector(".narrative"),
    canvas: document.getElementById("bridge-canvas"),
    container: document.querySelector(".bridge-3d"),
    init: (canvas) => createBridgeScene(canvas),
  },
  {
    key: "network",
    section: document.querySelector(".network"),
    canvas: document.getElementById("network-canvas"),
    container: document.querySelector(".network-3d"),
    init: (canvas) => createNetworkScene(canvas, tooltipController),
  },
];

const sceneState = new Map();

const initScene = (sceneConfig) => {
  if (!sceneConfig.section || !sceneConfig.canvas || !sceneConfig.container) {
    return null;
  }

  if (!supportsWebGL || !hasThree) {
    sceneConfig.container.classList.add("is-disabled");
    return null;
  }

  if (!sceneState.has(sceneConfig.key)) {
    const controller = sceneConfig.init(sceneConfig.canvas, sceneConfig.section);
    sceneState.set(sceneConfig.key, controller);
    sceneConfig.container.classList.add("is-ready");
    sceneConfig.section.classList.add("has-3d");

    if (sceneConfig.key === "bridge") {
      sceneConfig.section.querySelector(".device-bridge")?.classList.add("is-3d");
    }

    if (sceneConfig.key === "network") {
      sceneConfig.section.querySelector(".network-viz")?.classList.add("is-3d");
    }

    if (prefersReducedMotion.matches) {
      controller.renderStatic?.();
    }
  }

  return sceneState.get(sceneConfig.key) || null;
};

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const config = sceneConfigs.find((scene) => scene.section === entry.target);
      if (!config) {
        return;
      }

      const controller = initScene(config);
      if (!controller) {
        return;
      }

      if (entry.isIntersecting) {
        if (!prefersReducedMotion.matches) {
          controller.start?.();
        }
      } else {
        controller.stop?.();
      }
    });
  },
  { threshold: 0.2 }
);

sceneConfigs.forEach((scene) => {
  if (scene.section) {
    sceneObserver.observe(scene.section);
  }
});

const handleResize = () => {
  sceneState.forEach((controller) => {
    controller?.onResize?.();
  });
};

let resizeTimer = null;
window.addEventListener("resize", () => {
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(handleResize, 140);
});

prefersReducedMotion.addEventListener("change", () => {
  sceneState.forEach((controller) => {
    if (!controller) {
      return;
    }
    if (prefersReducedMotion.matches) {
      controller.stop?.();
      controller.renderStatic?.();
    }
  });
  if (prefersReducedMotion.matches) {
    heroSection?.classList.remove("hero--scrub");
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
  } else if (!isMobileViewport()) {
    heroSection?.classList.add("hero--scrub");
    unlockHeroScroll();
  }
});
