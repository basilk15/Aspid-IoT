(() => {
  const flow = document.querySelector("[data-tx-flow]");
  const canvas = flow?.querySelector("[data-tx-canvas]");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!flow || !canvas || !context) return;

  const find = (selector) => flow.querySelector(selector);
  const fields = {
    deviceTemp: find("[data-tx-device-temp]"),
    deviceHumidity: find("[data-tx-device-humidity]"),
    deviceStatus: find("[data-tx-device-status]"),
    coreStatus: find("[data-tx-core-status]"),
    cipher: find("[data-tx-cipher]"),
    sinkTemp: find("[data-tx-sink-temp]"),
    sinkHumidity: find("[data-tx-sink-humidity]"),
    sinkHeading: find("[data-tx-sink-heading]"),
    sinkStatus: find("[data-tx-sink-status]"),
    sentCount: find("[data-tx-sent-count]"),
    receivedCount: find("[data-tx-received-count]"),
  };
  if (Object.values(fields).some((field) => !field)) return;

  // The scene uses representative data. No browser-to-device connection is made.
  const samples = [
    { temp: "24.6", humidity: "48", cipher: "8F A2 C7 4D E0 91" },
    { temp: "24.7", humidity: "48", cipher: "B3 61 0E DA 72 4C" },
    { temp: "24.7", humidity: "49", cipher: "5C D8 92 07 A6 31" },
    { temp: "24.5", humidity: "49", cipher: "E1 4B 76 CB 83 0F" },
    { temp: "24.6", humidity: "48", cipher: "2D 9A F4 65 18 BE" },
  ];
  const cycleDuration = 4800;
  const launchTime = 720;
  const arrivalTime = 3350;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const countLabel = (count) => String(count).padStart(2, "0");
  const setText = (element, value) => {
    if (element.textContent !== value) element.textContent = value;
  };

  let width = 0;
  let height = 0;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = 0;
  let currentProgress = null;
  let shownCycle = -1;
  let deliveredCycle = -1;
  let frameId = 0;
  let visible = false;

  function point(t, offset = 0) {
    if (width < 768) {
      return {
        x: width * (0.5 - 0.018 * Math.sin(Math.PI * t)) + offset,
        y: height * (0.13 + 0.72 * t),
      };
    }
    return {
      x: width * (0.08 + 0.84 * t),
      y: height * (0.68 - 0.09 * Math.sin(Math.PI * t)) + offset,
    };
  }

  function strokeRoute(offset, lineWidth, color, blur = 0) {
    context.beginPath();
    for (let step = 0; step <= 80; step++) {
      const position = point(step / 80, offset);
      if (step === 0) context.moveTo(position.x, position.y);
      else context.lineTo(position.x, position.y);
    }
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowColor = document.documentElement.dataset.theme === "light"
      ? "rgba(8, 127, 148, 0.3)"
      : "#4fdfff";
    context.shadowBlur = blur;
    context.stroke();
    context.shadowBlur = 0;
  }

  function draw(progress = null) {
    if (!width || !height) return;
    const lightTheme = document.documentElement.dataset.theme === "light";
    context.clearRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = lightTheme ? "source-over" : "lighter";

    const sideways = width < 768;
    for (let strand = -3; strand <= 3; strand++) {
      const offset = strand * (sideways ? 8 : 7);
      const opacity = lightTheme
        ? (strand === 0 ? 0.2 : 0.1)
        : (strand === 0 ? 0.16 : 0.075);
      strokeRoute(offset, 1, lightTheme
        ? `rgba(22, 104, 128, ${opacity})`
        : `rgba(58, 170, 205, ${opacity})`);
    }
    strokeRoute(0, 15, lightTheme ? "rgba(8, 127, 148, 0.06)" : "rgba(22, 176, 230, 0.08)", lightTheme ? 14 : 26);
    strokeRoute(0, 3.4, lightTheme ? "rgba(8, 127, 148, 0.3)" : "rgba(75, 218, 251, 0.42)", lightTheme ? 8 : 20);
    strokeRoute(0, 1.1, lightTheme ? "rgba(16, 76, 95, 0.72)" : "rgba(209, 253, 255, 0.8)", lightTheme ? 3 : 8);

    const motion = elapsed / 9600;
    for (let index = 0; index < 38; index++) {
      const t = (index / 38 + motion) % 1;
      const offset = ((index * 17) % 9 - 4) * (sideways ? 2 : 1.8);
      const head = point(t, offset);
      const tail = point(Math.max(0, t - 0.012), offset);
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(head.x, head.y);
      context.lineWidth = index % 7 === 0 ? 2.4 : 1.15;
      context.strokeStyle = lightTheme
        ? (t < 0.49 ? "rgba(16, 76, 95, 0.58)" : "rgba(8, 127, 148, 0.72)")
        : (t < 0.49 ? "rgba(198, 249, 255, 0.67)" : "rgba(82, 218, 255, 0.64)");
      context.stroke();
    }

    const gate = point(0.5);
    context.beginPath();
    if (sideways) {
      context.moveTo(gate.x - 34, gate.y - 23);
      context.lineTo(gate.x - 17, gate.y - 7);
      context.lineTo(gate.x - 34, gate.y + 8);
      context.moveTo(gate.x + 29, gate.y - 23);
      context.lineTo(gate.x + 12, gate.y - 7);
      context.lineTo(gate.x + 29, gate.y + 8);
    } else {
      context.moveTo(gate.x - 27, gate.y - 42);
      context.lineTo(gate.x - 9, gate.y);
      context.lineTo(gate.x - 27, gate.y + 42);
      context.moveTo(gate.x + 27, gate.y - 42);
      context.lineTo(gate.x + 9, gate.y);
      context.lineTo(gate.x + 27, gate.y + 42);
    }
    context.strokeStyle = lightTheme ? "rgba(8, 127, 148, 0.66)" : "rgba(103, 233, 255, 0.44)";
    context.lineWidth = 1.4;
    context.shadowColor = lightTheme ? "#087f94" : "#59f7ff";
    context.shadowBlur = lightTheme ? 7 : 15;
    context.stroke();
    context.shadowBlur = 0;

    if (progress !== null) {
      const head = point(progress);
      const tail = point(Math.max(0, progress - 0.075));
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(head.x, head.y);
      context.strokeStyle = lightTheme ? "rgba(8, 127, 148, 0.92)" : "rgba(232, 255, 255, 0.97)";
      context.lineWidth = lightTheme ? 3.5 : 5.5;
      context.lineCap = "round";
      context.shadowColor = lightTheme ? "#087f94" : "#65eaff";
      context.shadowBlur = lightTheme ? 12 : 30;
      context.stroke();
      context.lineCap = "butt";
      context.shadowBlur = 0;

      const flare = context.createRadialGradient(head.x, head.y, 1, head.x, head.y, 24);
      flare.addColorStop(0, lightTheme ? "rgba(8, 127, 148, 0.5)" : "rgba(244, 255, 255, 0.92)");
      flare.addColorStop(0.25, lightTheme ? "rgba(89, 180, 200, 0.24)" : "rgba(95, 235, 255, 0.43)");
      flare.addColorStop(1, lightTheme ? "rgba(89, 180, 200, 0)" : "rgba(95, 235, 255, 0)");
      context.fillStyle = flare;
      context.fillRect(head.x - 24, head.y - 24, 48, 48);

      // Illustrative bytes travel beside the light path; they are not a computed cipher output.
      const bytes = samples[Math.floor(elapsed / cycleDuration) % samples.length].cipher.split(" ");
      context.font = "600 12px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillStyle = lightTheme ? "rgba(16, 76, 95, 0.88)" : "rgba(178, 247, 255, 0.82)";
      context.shadowColor = lightTheme ? "rgba(8, 127, 148, 0.25)" : "#59f7ff";
      context.shadowBlur = lightTheme ? 4 : 10;
      for (let index = 0; index < 4; index++) {
        const trail = progress - 0.042 * (index + 1);
        if (trail <= 0.05) continue;
        const position = point(trail);
        if (sideways) context.fillText(bytes[index], position.x + 12, position.y - 7);
        else context.fillText(bytes[index], position.x - 8, position.y - 21 - (index % 2) * 7);
      }
      context.shadowBlur = 0;
    }

    context.restore();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(currentProgress);
  }

  function showDevice(cycle) {
    const sample = samples[cycle % samples.length];
    const number = countLabel(cycle + 1);
    setText(fields.deviceTemp, sample.temp);
    setText(fields.deviceHumidity, sample.humidity);
    setText(fields.sentCount, number);
    setText(fields.cipher, sample.cipher);
    setText(fields.deviceStatus, `Securing sample ${number}`);
    setText(fields.coreStatus, "Securing telemetry at the edge");
    flow.classList.remove("is-processed");
  }

  function showProcessed(cycle) {
    const sample = samples[cycle % samples.length];
    const number = countLabel(cycle + 1);
    setText(fields.sinkTemp, sample.temp);
    setText(fields.sinkHumidity, sample.humidity);
    setText(fields.sinkHeading, "Decrypted");
    setText(fields.sinkStatus, `Processed sample ${number}`);
    setText(fields.receivedCount, number);
    setText(fields.coreStatus, "Authenticated at the receiving sink");
    flow.classList.add("has-processed", "is-processed");
  }

  function shouldRun() {
    return visible && !document.hidden && !reducedMotion.matches;
  }

  function tick(time) {
    if (!shouldRun()) {
      frameId = 0;
      lastTime = 0;
      return;
    }
    if (lastTime) elapsed += Math.min(time - lastTime, 100);
    lastTime = time;
    const cycle = Math.floor(elapsed / cycleDuration);
    const phase = elapsed % cycleDuration;
    if (cycle !== shownCycle) {
      shownCycle = cycle;
      showDevice(cycle);
    }
    const transmitting = phase >= launchTime && phase < arrivalTime;
    flow.classList.toggle("is-sealing", phase < launchTime);
    flow.classList.toggle("is-transmitting", transmitting);
    if (transmitting) {
      setText(fields.deviceStatus, `Sample ${countLabel(cycle + 1)} protected`);
      setText(fields.coreStatus, "Protected signal in transit");
    }
    if (phase >= arrivalTime && deliveredCycle !== cycle) {
      deliveredCycle = cycle;
      showProcessed(cycle);
      setText(fields.deviceStatus, `Sample ${countLabel(cycle + 1)} sent`);
    }
    currentProgress = transmitting ? (phase - launchTime) / (arrivalTime - launchTime) : null;
    if (time - lastPaint >= 32) {
      draw(currentProgress);
      lastPaint = time;
    }
    frameId = requestAnimationFrame(tick);
  }

  function sync() {
    if (shouldRun()) {
      if (!frameId) frameId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastTime = 0;
    }
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(flow);
  } else {
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }
  resizeCanvas();

  if ("MutationObserver" in window) {
    new MutationObserver(() => draw(currentProgress)).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      flow.classList.toggle("is-active", visible);
      sync();
    }, { threshold: 0.1 }).observe(flow);
  } else {
    visible = true;
    flow.classList.add("is-active");
  }
  document.addEventListener("visibilitychange", sync);

  if (reducedMotion.matches) {
    showDevice(0);
    showProcessed(0);
    setText(fields.deviceStatus, "Sample 01 protected");
  }
  reducedMotion.addEventListener?.("change", () => {
    elapsed = 0;
    shownCycle = -1;
    deliveredCycle = -1;
    if (reducedMotion.matches) {
      showDevice(0);
      showProcessed(0);
      setText(fields.deviceStatus, "Sample 01 protected");
      draw();
    } else {
      flow.classList.remove("has-processed", "is-processed", "is-transmitting");
      setText(fields.sinkHeading, "Waiting");
      setText(fields.sinkTemp, "—");
      setText(fields.sinkHumidity, "—");
      setText(fields.sinkStatus, "Awaiting protected reading");
      setText(fields.receivedCount, "00");
    }
    sync();
  });
  sync();
})();
