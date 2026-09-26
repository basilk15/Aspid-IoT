(() => {
  const section = document.querySelector(".services-common-section");
  const stage = section?.querySelector(".services-common-stage");
  const cards = Array.from(section?.querySelectorAll(".services-common-card") || []);
  if (!section || !stage || cards.length !== 3) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const starts = [-0.1, 0.24, 0.57];
  let frame = 0;

  const render = () => {
    frame = 0;
    if (reducedMotion.matches) return;

    const bounds = section.getBoundingClientRect();
    const viewport = window.innerHeight;
    if (bounds.top > viewport * 1.5 || bounds.bottom < -viewport * 0.5) return;
    const travel = Math.max(1, bounds.height - stage.getBoundingClientRect().height);
    const progress = clamp(-bounds.top / travel, 0, 1);

    cards.forEach((card, index) => {
      const enter = clamp((progress - starts[index]) / 0.18, 0, 1);
      const settle = 1 - (1 - enter) ** 3;
      const exit = index === cards.length - 1 ? 0 : clamp((progress - starts[index] - 0.26) / 0.18, 0, 1);
      card.style.setProperty("--story-opacity", (enter * (1 - exit)).toFixed(3));
      card.style.setProperty("--story-scale", (0.72 + 0.28 * settle + 0.28 * exit).toFixed(3));
      card.style.setProperty("--story-y", `${(120 * (1 - settle) - 70 * exit).toFixed(1)}px`);
      card.style.setProperty("--story-rotate", `${(17 * (1 - settle) - 7 * exit).toFixed(1)}deg`);
      card.style.zIndex = String(cards.length - index);
    });

  };

  const schedule = () => {
    if (!frame && !reducedMotion.matches) frame = window.requestAnimationFrame(render);
  };

  const updateMotion = () => {
    section.classList.toggle("is-story-ready", !reducedMotion.matches);
    schedule();
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  reducedMotion.addEventListener?.("change", updateMotion);
  updateMotion();
})();
