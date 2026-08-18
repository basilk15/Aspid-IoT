(() => {
  const root = document.documentElement;
  const storageKey = "aspid-theme";
  const themeButtons = document.querySelectorAll("[data-theme-toggle]");

  const readStoredTheme = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const writeStoredTheme = (theme) => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The preference still applies for this page when storage is unavailable.
    }
  };

  const applyTheme = (theme, persist = false) => {
    const isLight = theme === "light";
    const resolvedTheme = isLight ? "light" : "dark";

    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    themeButtons.forEach((button) => {
      const targetTheme = isLight ? "dark" : "light";
      const targetLabel = isLight ? "Dark" : "Light";
      const targetDescription = `Switch to ${targetTheme} mode`;

      button.setAttribute("aria-pressed", String(isLight));
      button.setAttribute("aria-label", targetDescription);
      button.setAttribute("title", targetDescription);
      button.dataset.theme = resolvedTheme;

      const label = button.querySelector("[data-theme-label]");
      if (label) {
        label.textContent = targetLabel;
      }
    });

    if (persist) {
      writeStoredTheme(resolvedTheme);
    }
  };

  const storedTheme = readStoredTheme();
  applyTheme(storedTheme === "light" || root.dataset.theme === "light" ? "light" : "dark");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "light" ? "dark" : "light", true);
    });
  });
})();
