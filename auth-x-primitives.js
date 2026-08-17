const authXPrimitivesStage = document.querySelector("[data-auth-x-primitives]");
const authXPrimitiveMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const activateAuthXPrimitives = () => {
  authXPrimitivesStage?.classList.add("is-active");
};

if (authXPrimitivesStage && (authXPrimitiveMotion.matches || !("IntersectionObserver" in window))) {
  activateAuthXPrimitives();
} else if (authXPrimitivesStage) {
  const authXPrimitivesObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      activateAuthXPrimitives();
      observer.disconnect();
    },
    { threshold: 0.22 }
  );

  authXPrimitivesObserver.observe(authXPrimitivesStage);
}
