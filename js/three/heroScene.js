import {
  THREE,
  clamp,
  createGlowTexture,
  createRenderer,
  resizeRendererToDisplaySize,
} from "./utils.js";

export const init = (canvas, options = {}) => {
  const { section, prefersReducedMotion, quality = "high" } = options;
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

  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 1.5);
  shieldShape.bezierCurveTo(1.2, 1.25, 1.3, 0.2, 0, -1.55);
  shieldShape.bezierCurveTo(-1.3, 0.2, -1.2, 1.25, 0, 1.5);

  const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 2,
  });
  shieldGeometry.center();

  const shieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1426,
    metalness: 0.45,
    roughness: 0.28,
    emissive: 0x1a4d5d,
    emissiveIntensity: 0.3,
  });
  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.rotation.x = Math.PI / 18;
  coreGroup.add(shield);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1c2b,
    metalness: 0.6,
    roughness: 0.18,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.7,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.05, 16, 100), ringMaterial);
  ring.rotation.x = Math.PI / 2.2;
  ring.rotation.z = Math.PI / 5;
  coreGroup.add(ring);

  const innerPlate = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.85, 64, 1),
    new THREE.MeshStandardMaterial({
      color: 0x081420,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  innerPlate.position.z = 0.18;
  coreGroup.add(innerPlate);

  const arcMaterial = new THREE.MeshStandardMaterial({
    color: 0x59f7ff,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.4,
  });

  const arcCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0.8, 0.3),
      new THREE.Vector3(0, 1.3, 0.5),
      new THREE.Vector3(1.2, 0.6, 0.2),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.4, -0.2, 0.4),
      new THREE.Vector3(0, 0.2, 0.9),
      new THREE.Vector3(1.3, -0.4, 0.4),
    ]),
  ];

  arcCurves.forEach((curve) => {
    const arcGeometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
    coreGroup.add(arcMesh);
  });

  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glowSprite.scale.set(5.2, 5.2, 1);
  coreGroup.add(glowSprite);

  const particleCount = quality === "low" ? 70 : quality === "medium" ? 120 : 200;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x74f1ff,
    size: quality === "low" ? 0.025 : 0.035,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  const ambient = new THREE.AmbientLight(0x87a5c9, 0.55);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.9);
  keyLight.position.set(2, 2.2, 4);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1.2, 12);
  rim.position.set(-2.2, 0.8, 2.4);
  scene.add(rim);

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();
  const mouseTarget = new THREE.Vector2(0, 0);
  const mouseCurrent = new THREE.Vector2(0, 0);

  const onPointerMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouseTarget.set(x, y);
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const renderFrame = (staticFrame = false) => {
    resizeRendererToDisplaySize(renderer, camera);

    const elapsed = staticFrame ? 0 : clock.getElapsedTime();
    const drift = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.5) * 0.1;

    mouseCurrent.lerp(mouseTarget, 0.08);

    const rect = section?.getBoundingClientRect();
    const scrollFactor = rect
      ? clamp(-rect.top / window.innerHeight, 0, 1)
      : 0;

    coreGroup.rotation.y = elapsed * 0.08;
    coreGroup.rotation.x = Math.PI / 18 + drift * 0.2 + scrollFactor * 0.15;
    ring.rotation.z = elapsed * 0.18;

    keyLight.position.x = 2 + mouseCurrent.x * 1.2;
    keyLight.position.y = 2 + mouseCurrent.y * 0.9;

    camera.position.z = 8 + scrollFactor * 1.2;
    camera.position.y = 0.6 + drift * 0.15;
    camera.lookAt(0, 0, 0);

    particles.rotation.y = elapsed * 0.02;

    renderer.render(scene, camera);
  };

  const animate = () => {
    if (!running) {
      return;
    }
    renderFrame();
    raf = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running || prefersReducedMotion) {
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

  const dispose = () => {
    stop();
    window.removeEventListener("pointermove", onPointerMove);
    renderer.dispose();
    shieldGeometry.dispose();
    ringMaterial.dispose();
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  };

  return {
    start,
    stop,
    dispose,
    onResize: () => resizeRendererToDisplaySize(renderer, camera),
    renderStatic: () => renderFrame(true),
  };
};
