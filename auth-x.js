const siteHeader = document.querySelector("[data-header]");
const navShell = document.querySelector(".nav-shell");
const navTraceSvg = navShell?.querySelector(".nav-shell-trace svg");
const navTracePath = navShell?.querySelector(".nav-shell-trace-path");
const navToggle = document.querySelector("[data-nav-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileLinks = document.querySelectorAll("[data-mobile-link]");
const dropdown = document.querySelector("[data-dropdown]");
const dropdownToggle = document.querySelector("[data-dropdown-toggle]");
const dropdownPanel = document.querySelector("[data-dropdown-panel]");
const productLinks = document.querySelectorAll("[data-product-link]");
const mobileProducts = document.querySelector(".mobile-products");
const mobileProductsToggle = document.querySelector("[data-mobile-products-toggle]");
const reveals = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

const setHeaderScrolledState = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
};

const isMobileViewport = () => window.innerWidth <= 768;

const setMobileMenuState = (isOpen) => {
  if (!siteHeader || !navToggle || !mobileMenu) {
    return;
  }

  siteHeader.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen && isMobileViewport());
};

const setDropdownState = (isOpen) => {
  if (!dropdown || !dropdownToggle || !dropdownPanel) {
    return;
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

updateNavTrace();
setHeaderScrolledState();
setMobileMenuState(false);
setDropdownState(false);
setMobileProductsState(false);
document.body.classList.add("is-loaded");

if (navShell && typeof ResizeObserver !== "undefined") {
  const navTraceObserver = new ResizeObserver(updateNavTrace);
  navTraceObserver.observe(navShell);
} else {
  window.addEventListener("resize", updateNavTrace);
}

window.addEventListener("scroll", setHeaderScrolledState, { passive: true });

if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const delay = Number(entry.target.dataset.delay || 0);
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );

  reveals.forEach((element) => revealObserver.observe(element));
} else {
  reveals.forEach((element) => element.classList.add("is-visible"));
}

dropdownToggle?.addEventListener("click", () => {
  if (!isMobileViewport()) {
    setDropdownState(!dropdown?.classList.contains("is-open"));
  }
});

dropdown?.addEventListener("mouseenter", () => {
  if (!isMobileViewport()) {
    setDropdownState(true);
  }
});

dropdown?.addEventListener("mouseleave", () => {
  if (!isMobileViewport()) {
    setDropdownState(false);
  }
});

dropdown?.addEventListener("focusin", () => {
  if (!isMobileViewport()) {
    setDropdownState(true);
  }
});

dropdown?.addEventListener("focusout", (event) => {
  if (!isMobileViewport() && !dropdown.contains(event.relatedTarget)) {
    setDropdownState(false);
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
  link.addEventListener("click", () => setDropdownState(false));
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

window.addEventListener("resize", () => {
  setDropdownState(false);
  if (!isMobileViewport()) {
    setMobileMenuState(false);
    setMobileProductsState(false);
  }
});

const authXHero = document.querySelector(".auth-x-hero");
const authXSignalStage = document.querySelector("[data-auth-x-signal]");
const AUTH_X_ORBIT_DELAY = 3200;
let authXOrbitTimer = null;

const queueAuthXOrbit = () => {
  if (!authXHero || !authXSignalStage || prefersReducedMotion.matches) {
    return;
  }

  if (authXOrbitTimer !== null) {
    window.clearTimeout(authXOrbitTimer);
  }

  authXOrbitTimer = window.setTimeout(() => {
    authXSignalStage.classList.add("is-orbiting");
  }, AUTH_X_ORBIT_DELAY);
};

if (authXHero && authXSignalStage && !prefersReducedMotion.matches) {
  if (authXHero.classList.contains("is-visible")) {
    queueAuthXOrbit();
  } else if (typeof MutationObserver !== "undefined") {
    const authXHeroVisibilityObserver = new MutationObserver(() => {
      if (!authXHero.classList.contains("is-visible")) {
        return;
      }

      authXHeroVisibilityObserver.disconnect();
      queueAuthXOrbit();
    });

    authXHeroVisibilityObserver.observe(authXHero, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
}

window.addEventListener("pagehide", () => {
  if (authXOrbitTimer !== null) {
    window.clearTimeout(authXOrbitTimer);
  }
});
