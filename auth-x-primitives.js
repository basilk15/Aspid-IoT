(() => {
  const session = document.querySelector("[data-auth-x-session]");
  if (!session || !("IntersectionObserver" in window)) return;

  const scene = session.querySelector(".auth-x-session-scene");
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < 0.35) return;

    observer.disconnect();
    if (motion.matches) session.classList.add("is-playing");
  }, { threshold: 0.35 });

  observer.observe(scene);
})();
