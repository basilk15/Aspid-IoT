const authXPrimitivesStage = document.querySelector("[data-auth-x-primitives]");
const authXPrimitiveMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const authXPrimitiveMotionToggle = document.querySelector("[data-auth-x-motion-toggle]");
let authXPrimitivesInView = false;
let authXPrimitivesPaused = false;

const updateAuthXPrimitivesMotion = () => {
  if (!authXPrimitivesStage) return;

  if (authXPrimitivesInView) {
    authXPrimitivesStage.classList.add("is-active");
  }

  authXPrimitivesStage.classList.toggle(
    "is-playing",
    authXPrimitivesInView && !document.hidden && !authXPrimitiveMotion.matches && !authXPrimitivesPaused
  );
};

authXPrimitiveMotionToggle?.addEventListener("click", () => {
  authXPrimitivesPaused = !authXPrimitivesPaused;
  authXPrimitiveMotionToggle.textContent = authXPrimitivesPaused ? "Play motion" : "Pause motion";
  updateAuthXPrimitivesMotion();
});

if (authXPrimitivesStage && !("IntersectionObserver" in window)) {
  authXPrimitivesInView = true;
  updateAuthXPrimitivesMotion();
} else if (authXPrimitivesStage) {
  const authXPrimitivesObserver = new IntersectionObserver(
    (entries) => {
      authXPrimitivesInView = entries.some((entry) => entry.isIntersecting);
      updateAuthXPrimitivesMotion();
    },
    { threshold: 0.12 }
  );
  authXPrimitivesObserver.observe(authXPrimitivesStage);
}

document.addEventListener("visibilitychange", updateAuthXPrimitivesMotion);
authXPrimitiveMotion.addEventListener("change", updateAuthXPrimitivesMotion);
