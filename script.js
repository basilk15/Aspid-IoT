/* global THREE */

const reveals = document.querySelectorAll(".reveal");
const heroBg = document.querySelector(".hero-bg");
const heroSection = document.querySelector(".hero");
const heroFeatures = document.querySelector(".hero-features");
const storyLines = document.querySelectorAll(".story-line");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileLinks = document.querySelectorAll("[data-mobile-link]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const dropdown = document.querySelector("[data-dropdown]");
const dropdownToggle = document.querySelector("[data-dropdown-toggle]");
const dropdownPanel = document.querySelector("[data-dropdown-panel]");
const mobileProducts = document.querySelector(".mobile-products");
const mobileProductsToggle = document.querySelector("[data-mobile-products-toggle]");
const productLinks = document.querySelectorAll("[data-product-link]");
const navShell = document.querySelector(".nav-shell");
const navTraceSvg = navShell?.querySelector(".nav-shell-trace svg");
const navTracePath = navShell?.querySelector(".nav-shell-trace-path");
let dropdownCloseTimer = null;
let dropdownHoverOpened = false;

const getNavTracePath = (width, height) => {
  const inset = 0.9;
  const x = inset;
  const y = inset;
  const w = Math.max(0, width - inset * 2);
  const h = Math.max(0, height - inset * 2);
  const radius = Math.min(23.1, Math.max(0, h / 2));
  const right = x + w;
  const bottom = y + h;
  const centerX = x + w / 2;

  return [
    `M ${centerX} ${bottom}`,
    `H ${x + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
    `V ${y + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    `H ${right - radius}`,
    `A ${radius} ${radius} 0 0 1 ${right} ${y + radius}`,
    `V ${bottom - radius}`,
    `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H ${centerX}`,
  ].join(" ");
};

const updateNavTrace = () => {
  if (!navShell || !navTraceSvg || !navTracePath) {
    return;
  }

  const width = navShell.clientWidth;
  const height = navShell.clientHeight;
  if (width <= 0 || height <= 0) {
    return;
  }

  navTraceSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  navTracePath.setAttribute("d", getNavTracePath(width, height));
};

updateNavTrace();

if (navShell && typeof ResizeObserver !== "undefined") {
  const navTraceObserver = new ResizeObserver(updateNavTrace);
  navTraceObserver.observe(navShell);
} else {
  window.addEventListener("resize", updateNavTrace);
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hasThree = typeof THREE !== "undefined";

const setHeaderScrolledState = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
};

const setMobileMenuState = (isOpen) => {
  if (!siteHeader || !navToggle || !mobileMenu) {
    return;
  }

  siteHeader.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen && isMobileViewport());
};

const cancelDropdownClose = () => {
  if (dropdownCloseTimer !== null) {
    window.clearTimeout(dropdownCloseTimer);
    dropdownCloseTimer = null;
  }
};

const scheduleDropdownClose = () => {
  cancelDropdownClose();
  dropdownCloseTimer = window.setTimeout(() => {
    dropdownCloseTimer = null;
    setDropdownState(false);
  }, 280);
};

const setDropdownState = (isOpen) => {
  if (!dropdown || !dropdownToggle || !dropdownPanel) {
    return;
  }

  cancelDropdownClose();
  if (!isOpen) {
    dropdownHoverOpened = false;
  }
  dropdown.classList.toggle("is-open", isOpen);
  dropdownToggle.setAttribute("aria-expanded", String(isOpen));
  dropdownPanel.setAttribute("aria-hidden", String(!isOpen));
};

const setMobileProductsState = (isOpen) => {
  if (!mobileProducts || !mobileProductsToggle) {
    return;
  }

  mobileProducts.classList.toggle("is-open", isOpen);
  mobileProductsToggle.setAttribute("aria-expanded", String(isOpen));
};

const setActiveNavLink = () => {
  const sections = [...document.querySelectorAll("main section[id]")];
  if (sections.length === 0 || navLinks.length === 0) {
    return;
  }

  const headerOffset = 140;
  let activeId = sections[0].id;

  sections.forEach((section) => {
    const rectTop = section.offsetTop - headerOffset;
    if (window.scrollY >= rectTop) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const linkId = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("is-active", linkId === activeId);
  });
};

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
  setHeaderScrolledState();
  setActiveNavLink();
  setMobileMenuState(false);
  setDropdownState(false);
  setMobileProductsState(false);
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
  setHeaderScrolledState();
  setActiveNavLink();
};

const ensureHeroUnlockedForViewport = () => {
  if (!heroSection) {
    return;
  }

  if (isMobileHeroSequence()) {
    updateMobileHeroSequence();
    unlockHeroScroll();
    return;
  }

  const heroTop = heroSection.offsetTop;
  const atHero = window.scrollY <= heroTop + 2;
  if (!atHero) {
    heroHasExited = true;
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
    return;
  }

  if (shouldGateHero() && heroHasExited) {
    heroHasExited = false;
    heroTargetProgress = 1;
    setHeroProgress(1);
    applyHeroState(2);
    // A trackpad often still has momentum as it crosses back onto the hero.
    // Briefly hold the completed composition, then let the next intentional
    // gesture scrub it in reverse.
    heroReentryCooldownUntil = performance.now() + 280;
  }

  if (!shouldGateHero()) {
    unlockHeroScroll();
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

dropdownToggle?.addEventListener("click", () => {
  if (isMobileViewport()) {
    return;
  }
  const isOpen = dropdown?.classList.contains("is-open");
  if (isOpen && dropdownHoverOpened) {
    dropdownHoverOpened = false;
    cancelDropdownClose();
    return;
  }
  dropdownHoverOpened = false;
  setDropdownState(!isOpen);
});

dropdown?.addEventListener("mouseenter", () => {
  if (!isMobileViewport()) {
    cancelDropdownClose();
    if (!dropdown.classList.contains("is-open")) {
      dropdownHoverOpened = true;
      setDropdownState(true);
    }
  }
});

dropdown?.addEventListener("mouseleave", (event) => {
  if (!isMobileViewport() && !dropdown.contains(event.relatedTarget)) {
    scheduleDropdownClose();
  }
});

dropdownPanel?.addEventListener("mouseenter", () => {
  if (!isMobileViewport()) {
    setDropdownState(true);
  }
});

dropdownPanel?.addEventListener("mouseleave", (event) => {
  if (!isMobileViewport() && !dropdown.contains(event.relatedTarget)) {
    scheduleDropdownClose();
  }
});

dropdown?.addEventListener("focusin", () => {
  if (!isMobileViewport()) {
    cancelDropdownClose();
  }
});

dropdown?.addEventListener("focusout", (event) => {
  if (!isMobileViewport() && !dropdown.contains(event.relatedTarget)) {
    scheduleDropdownClose();
  }
});

navToggle?.addEventListener("click", () => {
  setMobileMenuState(!siteHeader?.classList.contains("is-open"));
});

mobileProductsToggle?.addEventListener("click", () => {
  setMobileProductsState(!mobileProducts?.classList.contains("is-open"));
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMobileMenuState(false);
    setMobileProductsState(false);
  });
});

productLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setDropdownState(false);
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (dropdown && !dropdown.contains(target)) {
    setDropdownState(false);
  }

  if (siteHeader && !siteHeader.contains(target) && isMobileViewport()) {
    setMobileMenuState(false);
    setMobileProductsState(false);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDropdownState(false);
    setMobileMenuState(false);
    setMobileProductsState(false);
  }
});

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
// Let the hero complete in about two normal wheel/trackpad gestures while
// retaining enough interpolation for the composition to feel fluid.
const HERO_SCRUB_DELTA = 640;
const HERO_SCRUB_SMOOTH = 0.16;
const HERO_MAX_GESTURE_DELTA = 320;
const HERO_GESTURE_IDLE_MS = 140;
let heroTargetProgress = 0;
let heroScrubRaf = null;
let heroHasExited = false;
let heroReentryCooldownUntil = 0;
let heroGestureDelta = 0;
let heroGestureDirection = 0;
let heroLastWheelAt = 0;

const getHeroWheelDelta = (event) => {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1;
  const rawDelta = event.deltaY * unit;
  const direction = Math.sign(rawDelta);
  const now = performance.now();

  if (direction !== heroGestureDirection || now - heroLastWheelAt > HERO_GESTURE_IDLE_MS) {
    heroGestureDelta = 0;
    heroGestureDirection = direction;
  }

  heroLastWheelAt = now;
  const remaining = Math.max(HERO_MAX_GESTURE_DELTA - heroGestureDelta, 0);
  const acceptedDelta = direction * Math.min(Math.abs(rawDelta), remaining);
  heroGestureDelta += Math.abs(acceptedDelta);
  return acceptedDelta;
};

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

  // Each piece uses an overlapping eased range. The previous staging reserved
  // the last 12% for the feature words, so one upward trackpad gesture could
  // remove them in a single frame.
  const easeStage = (start, duration) => {
    const progress = clamp((heroProgress - start) / duration, 0, 1);
    return progress * progress * (3 - 2 * progress);
  };
  const orbitEase = easeStage(0.04, 0.6);
  const logoProgress = easeStage(0.08, 0.92);
  const featureProgress = easeStage(0, 1);
  const logoShift = heroLeftShiftPx * logoProgress;
  const logoScale = 1 - 0.08 * logoProgress;
  const featuresShift = (1 - featureProgress) * 16;
  const featureShift = (1 - featureProgress) * 12;
  const mobileLogoProgress = clamp((heroProgress - 0.6) / 0.4, 0, 1);
  const mobileFeatureOne = clamp((heroProgress - 0.84) / 0.06, 0, 1);
  const mobileFeatureTwo = clamp((heroProgress - 0.9) / 0.06, 0, 1);
  const mobileFeatureThree = clamp((heroProgress - 0.96) / 0.04, 0, 1);
  const mobileActions = clamp((heroProgress - 0.99) / 0.01, 0, 1);
  heroSection?.style.setProperty("--hero-logo-progress", logoProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-features-progress", featureProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-logo-shift", `${logoShift.toFixed(2)}px`);
  heroSection?.style.setProperty("--hero-logo-scale", logoScale.toFixed(3));
  heroSection?.style.setProperty("--hero-features-opacity", featureProgress.toFixed(3));
  heroSection?.style.setProperty("--hero-features-shift", `${featuresShift.toFixed(2)}px`);
  heroSection?.style.setProperty("--hero-feature-shift", `${featureShift.toFixed(2)}px`);
  heroSection?.style.setProperty("--hero-orbit-opacity", orbitEase.toFixed(3));
  heroSection?.style.setProperty("--hero-orbit-scale", (0.88 + orbitEase * 0.12).toFixed(3));
  heroSection?.style.setProperty("--hero-core-opacity", (0.65 * orbitEase).toFixed(3));
  heroSection?.style.setProperty("--mobile-logo-lift", `${(mobileLogoProgress * 150).toFixed(2)}px`);
  heroSection?.style.setProperty("--mobile-logo-scale", (1 - mobileLogoProgress * 0.2).toFixed(3));
  heroSection?.style.setProperty("--mobile-feature-1", mobileFeatureOne.toFixed(3));
  heroSection?.style.setProperty("--mobile-feature-2", mobileFeatureTwo.toFixed(3));
  heroSection?.style.setProperty("--mobile-feature-3", mobileFeatureThree.toFixed(3));
  heroSection?.style.setProperty("--mobile-feature-1-shift", `${((1 - mobileFeatureOne) * 24).toFixed(2)}px`);
  heroSection?.style.setProperty("--mobile-feature-2-shift", `${((1 - mobileFeatureTwo) * 24).toFixed(2)}px`);
  heroSection?.style.setProperty("--mobile-feature-3-shift", `${((1 - mobileFeatureThree) * 24).toFixed(2)}px`);
  heroSection?.style.setProperty("--mobile-actions-opacity", mobileActions.toFixed(3));
  heroSection?.style.setProperty("--mobile-actions-shift", `${((1 - mobileActions) * 20).toFixed(2)}px`);
  if (isMobileViewport()) {
    heroSection?.classList.toggle("hero--mobile-ready", mobileActions >= 0.995);
  } else {
    heroSection?.classList.remove("hero--mobile-ready");
  }
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

const isMobileHeroSequence = () => {
  return !!heroSection && isMobileViewport() && !prefersReducedMotion.matches;
};

const getMobileHeroProgress = () => {
  if (!heroSection) {
    return 0;
  }

  const heroTop = heroSection.offsetTop;
  const scrollSpan = Math.max(heroSection.offsetHeight - window.innerHeight, 1);
  return clamp((window.scrollY - heroTop) / scrollSpan, 0, 1);
};

const updateMobileHeroSequence = () => {
  if (!isMobileHeroSequence()) {
    return;
  }

  const progress = getMobileHeroProgress();
  heroSection.classList.add("hero--mobile-sequence");
  heroSection.classList.remove("hero--scrub", "hero--centered", "hero--logo-left", "hero--features-visible");
  heroTargetProgress = progress;
  setHeroProgress(progress);
};

const setupHeroScrollLock = () => {
  if (!heroSection) {
    return;
  }
  if (prefersReducedMotion.matches || isMobileViewport()) {
    heroSection.classList.remove("hero--scrub");
    heroSection.classList.toggle("hero--mobile-sequence", isMobileViewport());
    unlockHeroScroll();
    if (prefersReducedMotion.matches) {
      setHeroProgress(1);
      heroTargetProgress = 1;
      applyHeroState(2);
    } else {
      updateMobileHeroSequence();
    }
    return;
  }
  heroSection.classList.add("hero--scrub");
  heroSection.classList.remove("hero--mobile-sequence", "hero--mobile-ready");
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

  if (performance.now() < heroReentryCooldownUntil) {
    lockHeroScroll();
    event.preventDefault();
    return;
  }

  if ((direction > 0 && heroProgress >= 1) || (direction < 0 && heroProgress <= 0)) {
    unlockHeroScroll();
    return;
  }

  // A high-velocity trackpad event can otherwise swallow most of the whole
  // hero timeline. Let one gesture advance a small, visible chapter instead.
  const wheelDelta = getHeroWheelDelta(event);
  if (wheelDelta === 0) {
    event.preventDefault();
    return;
  }

  const delta = wheelDelta / HERO_SCRUB_DELTA;
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

    if (performance.now() < heroReentryCooldownUntil) {
      lockHeroScroll();
      event.preventDefault();
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
  setDropdownState(false);
  if (isMobileHeroSequence()) {
    heroSection?.classList.add("hero--mobile-sequence");
    heroSection?.classList.remove("hero--scrub");
    unlockHeroScroll();
    updateMobileHeroSequence();
  } else if (!shouldGateHero()) {
    heroSection?.classList.remove("hero--scrub");
    heroSection?.classList.remove("hero--mobile-sequence", "hero--mobile-ready");
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
  } else {
    heroSection?.classList.add("hero--scrub");
    heroSection?.classList.remove("hero--mobile-sequence", "hero--mobile-ready");
    unlockHeroScroll();
  }
  if (!isMobileViewport()) {
    setMobileMenuState(false);
    setMobileProductsState(false);
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
    new THREE.TorusGeometry(2.05, 0.1, 24, 120),
    new THREE.MeshStandardMaterial({
      color: 0x1b5364,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.72,
      transparent: true,
      opacity: 0.72,
    })
  );
  ring.rotation.x = Math.PI / 2.3;
  ring.rotation.z = Math.PI / 5;
  coreGroup.add(ring);

  const ringBack = new THREE.Mesh(
    ring.geometry,
    new THREE.MeshBasicMaterial({
      color: 0x2a7b84,
      transparent: true,
      opacity: 0.24,
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
    const cycle = 8;
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

/* A quieter, more physical network visualization for the telemetry section. */
const createNetworkSceneRealistic = (canvas, onHover) => {
  const quality = getQualityTier();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 6, 18);

  const camera = new THREE.PerspectiveCamera(
    38,
    Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1),
    0.1,
    40
  );
  camera.position.set(0, 1.05, 6.9);

  const renderer = createRenderer(canvas);
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = quality !== "low";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const glowTexture = createGlowTexture(
    "rgba(135, 250, 255, 0.95)",
    "rgba(54, 188, 214, 0.2)"
  );
  const warmGlowTexture = createGlowTexture(
    "rgba(255, 205, 133, 0.78)",
    "rgba(255, 142, 70, 0.12)"
  );

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.35, 64),
    new THREE.MeshBasicMaterial({
      color: 0x07131f,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.38;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(6.4, 16, 0x1b4654, 0x112734);
  grid.position.y = -1.36;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.12;
  });
  scene.add(grid);

  const rangeRings = [1.42, 2.05].map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.009, radius + 0.009, 96),
      new THREE.MeshBasicMaterial({
        color: index === 0 ? 0x59f7ff : 0x315a6b,
        transparent: true,
        opacity: index === 0 ? 0.13 : 0.07,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.345;
    scene.add(ring);
    return ring;
  });

  const ambient = new THREE.AmbientLight(0x8ba7bf, 0.65);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xd7e8ff, 1.15);
  keyLight.position.set(4, 5, 6);
  keyLight.castShadow = renderer.shadowMap.enabled;
  if (keyLight.castShadow) {
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
  }
  scene.add(keyLight);

  const cyanLight = new THREE.PointLight(0x59f7ff, 1.4, 9);
  cyanLight.position.set(-3.2, 1.6, 3.5);
  scene.add(cyanLight);

  const warmLight = new THREE.PointLight(0xffb26d, 0.32, 7);
  warmLight.position.set(3.5, 0.3, 1.5);
  scene.add(warmLight);

  const fillLight = new THREE.PointLight(0x9dc9d7, 0.72, 9);
  fillLight.position.set(0, 2.8, 4.2);
  scene.add(fillLight);

  const gateway = new THREE.Group();
  gateway.position.y = -0.03;
  scene.add(gateway);

  const gatewayBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x172b3b,
    metalness: 0.82,
    roughness: 0.3,
    emissive: 0x071c29,
    emissiveIntensity: 0.28,
  });
  const gatewayEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b5c69,
    metalness: 0.76,
    roughness: 0.24,
    emissive: 0x0b2733,
    emissiveIntensity: 0.22,
  });
  const gatewayPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1725,
    metalness: 0.65,
    roughness: 0.34,
    emissive: 0x0e5d68,
    emissiveIntensity: 0.22,
  });
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x07131d,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x35c7d0,
    emissiveIntensity: 0.42,
  });
  const cyanIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x78f7ff });
  const amberIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffc27a });

  const gatewayBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 0.16, 1.12),
    gatewayEdgeMaterial
  );
  gatewayBase.position.y = -0.68;
  gatewayBase.castShadow = true;
  gatewayBase.receiveShadow = true;
  gateway.add(gatewayBase);

  const gatewayBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.92, 0.78),
    gatewayBodyMaterial
  );
  gatewayBody.position.y = -0.12;
  gatewayBody.castShadow = true;
  gatewayBody.receiveShadow = true;
  gateway.add(gatewayBody);

  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.46, 0.07, 0.86),
    gatewayEdgeMaterial
  );
  topPlate.position.y = 0.37;
  topPlate.castShadow = true;
  gateway.add(topPlate);

  const frontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.68, 0.035),
    gatewayPanelMaterial
  );
  frontPanel.position.set(0, -0.13, 0.405);
  gateway.add(frontPanel);

  const gatewayScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.25, 0.025),
    screenMaterial
  );
  gatewayScreen.position.set(0, 0.04, 0.432);
  gateway.add(gatewayScreen);

  const screenBars = [];
  [0.27, 0.05, -0.17].forEach((y, index) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(index === 0 ? 0.28 : 0.18, 0.018, 0.012),
      index === 2 ? amberIndicatorMaterial : cyanIndicatorMaterial
    );
    bar.position.set(-0.28, y, 0.452);
    gateway.add(bar);
    screenBars.push(bar);
  });

  [-0.36, -0.12, 0.12, 0.36].forEach((x, index) => {
    const port = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.035, 0.018),
      index === 3 ? amberIndicatorMaterial : cyanIndicatorMaterial
    );
    port.position.set(x, -0.38, 0.452);
    gateway.add(port);
  });

  const mastMaterial = new THREE.MeshStandardMaterial({
    color: 0x274c5a,
    metalness: 0.7,
    roughness: 0.25,
  });
  [-0.28, 0.28].forEach((x) => {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8),
      mastMaterial
    );
    mast.position.set(x, 0.68, 0);
    mast.castShadow = true;
    gateway.add(mast);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      cyanIndicatorMaterial
    );
    tip.position.set(x, 0.96, 0);
    gateway.add(tip);
  });

  const gatewayBeacon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x7ff7ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  gatewayBeacon.scale.set(0.72, 0.72, 1);
  gatewayBeacon.position.set(0, 0.9, 0.2);
  gateway.add(gatewayBeacon);

  const nodeLayout = [
    { position: [-2.55, 0.96, -0.1], rotation: -0.18 },
    { position: [2.55, 1.04, -0.36], rotation: 0.14 },
    { position: [-2.78, -0.58, -0.25], rotation: 0.18 },
    { position: [2.76, -0.7, 0.2], rotation: -0.12 },
    { position: [-1.56, -1.18, 0.58], rotation: 0.08 },
    { position: [1.58, 1.42, 0.55], rotation: -0.08 },
  ];

  const nodes = [];
  const links = [];
  const packets = [];
  const nodeBodyGeometry = new THREE.BoxGeometry(0.5, 0.18, 0.35);
  const nodeBoardGeometry = new THREE.BoxGeometry(0.32, 0.025, 0.22);
  const nodeChipGeometry = new THREE.BoxGeometry(0.08, 0.035, 0.08);
  const antennaGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
  const nodeTipGeometry = new THREE.SphereGeometry(0.025, 10, 8);

  const setFade = (record, fade) => {
    record.materials.forEach(({ material, opacity }) => {
      material.opacity = opacity * fade;
    });
    record.group.visible = fade > 0.002;
  };

  nodeLayout.forEach((layout, index) => {
    const group = new THREE.Group();
    group.position.set(...layout.position);
    group.rotation.y = layout.rotation;
    scene.add(group);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x193344,
      metalness: 0.78,
      roughness: 0.3,
      emissive: 0x0a2b39,
      emissiveIntensity: 0.26,
      transparent: true,
      opacity: 0.94,
    });
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x347889,
      metalness: 0.55,
      roughness: 0.34,
      emissive: 0x0e6470,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.86,
    });
    const chipMaterial = new THREE.MeshStandardMaterial({
      color: 0x172c3d,
      metalness: 0.68,
      roughness: 0.22,
      emissive: 0x4cd9df,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.9,
    });
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a9ba3,
      metalness: 0.64,
      roughness: 0.28,
      transparent: true,
      opacity: 0.9,
    });
    const ledMaterial = new THREE.MeshBasicMaterial({
      color: index === 3 ? 0xffc27a : 0x7ff7ff,
      transparent: true,
      opacity: 0.88,
    });

    const body = new THREE.Mesh(nodeBodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData = {
      label: `Sensor Node ${index + 1}`,
      status: "Encrypted uplink",
      crypto: "LWC / AEAD",
    };
    group.add(body);

    const board = new THREE.Mesh(nodeBoardGeometry, boardMaterial);
    board.position.y = 0.088;
    group.add(board);

    const chip = new THREE.Mesh(nodeChipGeometry, chipMaterial);
    chip.position.set(0, 0.11, 0.01);
    group.add(chip);

    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 0.29;
    group.add(antenna);

    const tip = new THREE.Mesh(nodeTipGeometry, ledMaterial);
    tip.position.y = 0.445;
    group.add(tip);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: index === 3 ? warmGlowTexture : glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.set(0.34, 0.34, 1);
    glow.position.set(0, 0.44, 0.02);
    group.add(glow);

    const record = {
      group,
      body,
      ledMaterial,
      glow,
      phase: index * 0.72,
      baseRotation: layout.rotation,
      materials: [
        { material: bodyMaterial, opacity: 0.94 },
        { material: boardMaterial, opacity: 0.86 },
        { material: chipMaterial, opacity: 0.9 },
        { material: antennaMaterial, opacity: 0.9 },
        { material: ledMaterial, opacity: 0.88 },
        { material: glow.material, opacity: 0.32 },
      ],
    };
    body.userData.record = record;
    nodes.push(body);
    setFade(record, 0);

    const start = new THREE.Vector3(...layout.position);
    const bend = new THREE.Vector3(
      layout.position[0] * 0.52,
      layout.position[1] * 0.54 + (layout.position[1] > 0 ? 0.22 : -0.04),
      layout.position[2] * 0.5 + 0.22
    );
    const gatewayPoint = new THREE.Vector3(0, -0.17, 0.45);
    const curve = new THREE.CatmullRomCurve3(
      [start, bend, gatewayPoint],
      false,
      "centripetal",
      0.35
    );
    const points = curve.getPoints(quality === "low" ? 40 : 64);
    const cableGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const cable = new THREE.Line(
      cableGeometry,
      new THREE.LineBasicMaterial({
        color: 0x244452,
        transparent: true,
        opacity: 0.42,
      })
    );
    cable.frustumCulled = false;
    scene.add(cable);

    const signal = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineDashedMaterial({
        color: 0x66eaf0,
        dashSize: 0.09,
        gapSize: 0.22,
        transparent: true,
        opacity: 0.24,
      })
    );
    signal.computeLineDistances();
    signal.frustumCulled = false;
    signal.geometry.setDrawRange(0, 0);
    scene.add(signal);

    const link = {
      curve,
      cable,
      signal,
      pointsCount: points.length,
      fade: 0,
      phase: index * 0.14,
    };
    links.push(link);

    const trailLength = quality === "low" ? 2 : 3;
    const trail = [];
    for (let trailIndex = 0; trailIndex < trailLength; trailIndex += 1) {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: trailIndex === 0 ? 0xc7ffff : 0x5ee9ef,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      const size = trailIndex === 0 ? 0.2 : 0.14 - trailIndex * 0.018;
      sprite.scale.set(size, size, 1);
      sprite.renderOrder = 4;
      sprite.visible = false;
      scene.add(sprite);
      trail.push(sprite);
    }
    packets.push({
      curve,
      trail,
      progress: (0.11 + index * 0.137) % 1,
      speed: 0.075 + (index % 3) * 0.012,
      link,
    });
  });

  const sceneTarget = new THREE.Vector3(0, -0.12, 0);
  let running = false;
  let raf = null;
  const clock = new THREE.Clock();
  const indicatorMaterials = screenBars.map((bar) => bar.material);

  const renderFrame = (staticFrame) => {
    resizeRendererToDisplaySize(renderer, camera);

    const elapsed = staticFrame ? 4.8 : clock.getElapsedTime();
    const introProgress = staticFrame ? 1 : clamp((elapsed - 0.18) / 1.65, 0, 1);

    nodes.forEach((body, index) => {
      const record = body.userData.record;
      const localProgress = clamp((introProgress - index * 0.055) / 0.72, 0, 1);
      const eased = 1 - Math.pow(1 - localProgress, 3);
      setFade(record, eased);
      record.group.scale.setScalar(0.72 + eased * 0.28);
      record.group.rotation.y = record.baseRotation + Math.sin(elapsed * 0.28 + record.phase) * 0.025;
      record.group.rotation.z = Math.sin(elapsed * 0.42 + record.phase) * 0.012;
      record.ledMaterial.opacity = 0.35 + eased * (0.35 + Math.abs(Math.sin(elapsed * 2.2 + record.phase)) * 0.3);
      record.glow.material.opacity = eased * (0.18 + Math.abs(Math.sin(elapsed * 1.7 + record.phase)) * 0.16);
    });

    links.forEach((link, index) => {
      const localProgress = clamp((introProgress - index * 0.055) / 0.72, 0, 1);
      const eased = 1 - Math.pow(1 - localProgress, 3);
      link.fade = eased;
      link.cable.material.opacity = 0.12 + eased * 0.32;
      link.signal.material.opacity = 0.06 + eased * 0.2;
      link.signal.material.dashOffset = -elapsed * (0.12 + index * 0.006);
      link.signal.geometry.setDrawRange(0, Math.max(0, Math.floor(link.pointsCount * eased)));
    });

    const packetTime = elapsed;
    let ingestPulse = 0;
    packets.forEach((packet) => {
      const linkProgress = packet.link.fade;
      const progress = (packet.progress + packetTime * packet.speed) % 1;
      if (progress > 0.88) {
        ingestPulse = Math.max(ingestPulse, (progress - 0.88) / 0.12);
      }

      packet.trail.forEach((sprite, trailIndex) => {
        const trailProgress = progress - trailIndex * 0.045;
        if (trailProgress < 0 || linkProgress < 0.2) {
          sprite.visible = false;
          return;
        }
        sprite.visible = true;
        sprite.position.copy(packet.curve.getPointAt(trailProgress));
        sprite.material.opacity = linkProgress * (0.72 - trailIndex * 0.16);
      });
    });

    const screenPulse = 0.34 + ingestPulse * 0.8 + Math.abs(Math.sin(elapsed * 1.4)) * 0.08;
    screenMaterial.emissiveIntensity = screenPulse;
    gatewayBeacon.material.opacity = 0.2 + ingestPulse * 0.38;
    gatewayBeacon.scale.setScalar(0.62 + ingestPulse * 0.22);
    screenBars.forEach((bar, index) => {
      const scale = 0.72 + (0.5 + Math.sin(elapsed * 1.3 + index * 0.8) * 0.5) * 0.28;
      bar.scale.x = scale;
      indicatorMaterials[index].opacity = 0.55 + Math.abs(Math.sin(elapsed * 1.5 + index)) * 0.4;
    });

    gateway.rotation.y = Math.sin(elapsed * 0.18) * 0.025;
    rangeRings[0].material.opacity = 0.1 + Math.abs(Math.sin(elapsed * 0.55)) * 0.045;
    rangeRings[1].material.opacity = 0.045 + Math.abs(Math.sin(elapsed * 0.38 + 1)) * 0.025;
    rangeRings[1].rotation.z = elapsed * 0.025;

    camera.position.x = Math.sin(elapsed * 0.12) * 0.16;
    camera.position.y = 1.05 + Math.sin(elapsed * 0.17) * 0.035;
    camera.lookAt(sceneTarget);
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
    onHover?.(null);
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
    heroSection?.classList.toggle("hero--mobile-sequence", isMobileViewport());
    unlockHeroScroll();
    setHeroProgress(1);
    heroTargetProgress = 1;
    applyHeroState(2);
  } else if (isMobileHeroSequence()) {
    heroSection?.classList.add("hero--mobile-sequence");
    unlockHeroScroll();
    updateMobileHeroSequence();
  } else if (!isMobileViewport()) {
    heroSection?.classList.add("hero--scrub");
    unlockHeroScroll();
  }
});
