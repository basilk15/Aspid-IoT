import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

export const DPR_CAP = 1.5;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (start, end, t) => start + (end - start) * t;
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const createRenderer = (canvas) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  return renderer;
};

export const resizeRendererToDisplaySize = (renderer, camera) => {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth || 1;
  const height = canvas.clientHeight || 1;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

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

export const createGlowTexture = (
  innerColor = "rgba(89, 247, 255, 0.85)",
  outerColor = "rgba(89, 247, 255, 0.25)"
) => {
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
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.45, outerColor);
  gradient.addColorStop(1, "rgba(89, 247, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createRadialTexture = (colors) => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2
  );

  colors.forEach(({ stop, color }) => {
    gradient.addColorStop(stop, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export { THREE };
