(() => {
  const deviceInput = document.querySelector("#active-device-count");
  const deviceSlider = document.querySelector("#active-device-slider");
  const billingButtons = document.querySelectorAll("[data-billing]");
  const productButtons = document.querySelectorAll("[data-product]");
  const billingNote = document.querySelector("#billing-note");
  const crossoverNote = document.querySelector("[data-crossover-note]");
  const estimator = document.querySelector(".pricing-estimator");

  if (!deviceInput || !deviceSlider || billingButtons.length === 0) return;

  const annualDiscount = 0.15;
  const plans = {
    auth: {
      label: "Auth-X",
      mark: "assets/auth-x-logos/auth-x-mark-v3.png",
      note: "Session setup for an existing telemetry path.",
      team: { base: 99, included: 50, overage: 0.75 },
      fleet: { base: 399, included: 500, overage: 0.45 },
    },
    tunnel: {
      label: "Tunnel-X",
      mark: "assets/tunnel-x/tunnel-x-mark-v4.png",
      note: "Requires a compatible external session provider. The integration interface is still planned.",
      team: { base: 149, included: 50, overage: 1.1 },
      fleet: { base: 599, included: 500, overage: 0.65 },
    },
    secure: {
      label: "Secure-X",
      mark: "assets/secure-x/secure-x-mark-v3.png",
      note: "Auth-X and Tunnel-X in one device-to-sink path.",
      team: { base: 199, included: 50, overage: 1.5 },
      fleet: { base: 799, included: 500, overage: 0.9 },
    },
  };

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let billingCycle = "monthly";
  let productKey = "secure";

  const adjustedBase = (tier) =>
    billingCycle === "yearly" ? tier.base * (1 - annualDiscount) : tier.base;

  const monthlyEquivalent = (tier, activeDevices) =>
    adjustedBase(tier) + Math.max(0, activeDevices - tier.included) * tier.overage;

  const getTier = (plan, activeDevices) => {
    const teamTotal = monthlyEquivalent(plan.team, activeDevices);
    const fleetTotal = monthlyEquivalent(plan.fleet, activeDevices);
    return teamTotal < fleetTotal - 0.004 ? "team" : "fleet";
  };

  const activeLabel = (count) => `${count.toLocaleString("en-US")} ${count === 1 ? "device" : "devices"}`;
  const countFromSlider = (position) => Math.max(1, Math.round(10 ** (Number(position) / 200)));
  const sliderFromCount = (count) => Math.round(Math.log10(count) * 200);

  const animateText = (element, value) => {
    if (!element || element.textContent === value) return;
    element.classList.remove("is-changing");
    element.textContent = value;
    void element.offsetWidth;
    element.classList.add("is-changing");
    window.setTimeout(() => element.classList.remove("is-changing"), 280);
  };

  const priceDetail = (tier, activeDevices) => {
    const base = adjustedBase(tier);
    const extraCount = Math.max(0, activeDevices - tier.included);

    if (billingCycle === "yearly") {
      const annualBase = currency.format(base * 12);
      const monthlyUsage = currency.format(extraCount * tier.overage);
      return extraCount > 0
        ? `${annualBase} annual base · ${monthlyUsage}/mo overage`
        : `${annualBase} annual base · no overage`;
    }

    return extraCount > 0
      ? `Base ${currency.format(base)} · ${extraCount.toLocaleString("en-US")} × ${currency.format(tier.overage)} overage`
      : `Base ${currency.format(base)} · ${tier.included} included`;
  };

  const renderEstimate = (activeDevices, valid) => {
    const plan = plans[productKey];
    const price = document.querySelector("[data-estimate-price]");
    const tierLabel = document.querySelector("[data-estimate-tier]");
    const caption = document.querySelector("[data-estimate-period]");
    const unit = document.querySelector("[data-estimate-unit]");
    const detail = document.querySelector("[data-estimate-detail]");
    const included = document.querySelector("[data-estimate-included]");
    const overage = document.querySelector("[data-estimate-overage]");
    const countCaption = document.querySelector("#active-device-caption");
    const productNote = document.querySelector("[data-product-note]");
    const productMark = document.querySelector("[data-estimate-mark]");

    animateText(productNote, plan.note);
    if (productMark && productMark.getAttribute("src") !== plan.mark) {
      productMark.setAttribute("src", plan.mark);
    }

    if (!valid) {
      animateText(price, "N/A");
      animateText(tierLabel, "N/A");
      animateText(caption, "Enter 1-100,000 active devices");
      animateText(unit, "");
      animateText(detail, "Use a whole number to see an estimate.");
      animateText(included, "N/A");
      animateText(overage, "N/A");
      animateText(countCaption, "Check device count");
      return;
    }

    const tierName = getTier(plan, activeDevices);
    const tier = plan[tierName];
    const estimatedTotal = monthlyEquivalent(tier, activeDevices);
    const label = tierName === "team" ? "Team" : "Fleet";

    animateText(price, currency.format(estimatedTotal));
    animateText(tierLabel, label);
    animateText(caption, billingCycle === "yearly" ? "Estimated monthly average" : "Estimated monthly total");
    animateText(unit, billingCycle === "yearly" ? "/ mo avg." : "/ month");
    animateText(detail, priceDetail(tier, activeDevices));
    animateText(included, tier.included.toLocaleString("en-US"));
    animateText(overage, currency.format(tier.overage));
    animateText(countCaption, activeLabel(activeDevices));
  };

  const updateCrossover = () => {
    if (!crossoverNote) return;
    const plan = plans[productKey];
    const team = plan.team;
    const fleet = plan.fleet;
    const crossover = team.included + (adjustedBase(fleet) - adjustedBase(team)) / team.overage;
    const firstFleetDevice = Math.ceil(crossover - 0.000001);

    crossoverNote.textContent = billingCycle === "yearly"
      ? `For ${plan.label} with annual prepay, Fleet becomes the recommended tier at ${firstFleetDevice} active devices.`
      : `For ${plan.label}, Fleet becomes the recommended tier at ${firstFleetDevice} active devices.`;
  };

  const render = () => {
    const activeDevices = Number(deviceInput.value);
    const valid = Number.isInteger(activeDevices) && activeDevices >= 1 && activeDevices <= 100000;
    deviceInput.setAttribute("aria-invalid", String(!valid));
    if (estimator) estimator.setAttribute("aria-invalid", String(!valid));
    deviceSlider.setAttribute("aria-valuetext", valid ? activeLabel(activeDevices) : "Invalid device count");
    deviceSlider.style.setProperty("--range-progress", `${Number(deviceSlider.value) / 10}%`);

    renderEstimate(activeDevices, valid);
    updateCrossover();

    if (billingNote) {
      billingNote.textContent = billingCycle === "yearly"
        ? "Annual base paid upfront; overage stays monthly."
        : "Annual prepay saves 15% on base; overage stays monthly.";
    }
  };

  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      billingCycle = button.dataset.billing === "yearly" ? "yearly" : "monthly";
      billingButtons.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      render();
    });
  });

  productButtons.forEach((button) => {
    button.addEventListener("click", () => {
      productKey = Object.hasOwn(plans, button.dataset.product) ? button.dataset.product : "secure";
      productButtons.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      render();
    });
  });

  deviceInput.addEventListener("input", () => {
    const count = Number(deviceInput.value);
    if (Number.isInteger(count) && count >= 1 && count <= 100000) {
      deviceSlider.value = String(sliderFromCount(count));
    }
    render();
  });

  deviceSlider.addEventListener("input", () => {
    deviceInput.value = String(countFromSlider(deviceSlider.value));
    render();
  });

  const pilotTerms = document.querySelector("#pilot-terms");
  const capabilities = document.querySelector("#capabilities");
  document.querySelectorAll('a[href="#pilot-terms"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (pilotTerms) pilotTerms.open = true;
    });
  });
  document.querySelectorAll('a[href="#capabilities"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (capabilities) capabilities.open = true;
    });
  });
  if (window.location.hash === "#pilot-terms" && pilotTerms) {
    pilotTerms.open = true;
  }
  if (window.location.hash === "#capabilities" && capabilities) {
    capabilities.open = true;
  }

  render();
})();
