import {
  THREE,
  clamp,
  createGlowTexture,
  createRadialTexture,
  createRenderer,
  easeInOutSine,
  lerp,
  resizeRendererToDisplaySize,
} from "./utils.js";

export const init = (canvas, options = {}) => {
  const { section, prefersReducedMotion, quality = "high" } = options;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 4, 16);

  const camera = new THREE.PerspectiveCamera(
    40,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    30
  );
  camera.position.set(0, 0.6, 6);

  const renderer = createRenderer(canvas);
  renderer.physicallyCorrectLights = true;

  const tunnelLength = 6.2;
  const tunnelRadius = quality === "low" ? 0.42 : 0.5;
  const tunnelSegments = quality === "low" ? 20 : 32;

  const tunnelMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0b1626,
    roughness: 0.2,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    transmission: 0.7,
    thickness: 0.4,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(
      tunnelRadius,
      tunnelRadius,
      tunnelLength,
      tunnelSegments,
      1,
      true
    ),
    tunnelMaterial
  );
  tunnel.rotation.z = Math.PI / 2;
  scene.add(tunnel);

  const innerGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(
      tunnelRadius * 0.92,
      tunnelRadius * 0.92,
      tunnelLength * 0.98,
      tunnelSegments,
      1,
      true
    ),
    new THREE.MeshBasicMaterial({
      color: 0x59f7ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  innerGlow.rotation.z = Math.PI / 2;
  scene.add(innerGlow);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1926,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.6,
  });
  const boundaryRing = new THREE.Mesh(
    new THREE.TorusGeometry(tunnelRadius * 1.05, 0.03, 16, 80),
    ringMaterial
  );
  boundaryRing.rotation.y = Math.PI / 2;
  scene.add(boundaryRing);

  const pulseSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  pulseSprite.scale.set(1.4, 1.4, 1);
  scene.add(pulseSprite);

  const capsuleGeometry = new THREE.CapsuleGeometry(
    quality === "low" ? 0.14 : 0.18,
    quality === "low" ? 0.5 : 0.65,
    8,
    16
  );

  const plainMaterial = new THREE.MeshStandardMaterial({
    color: 0x13202a,
    emissive: 0x7ad0ff,
    emissiveIntensity: 0.22,
    roughness: 0.45,
    metalness: 0.1,
    transparent: true,
    opacity: 1,
  });

  const cipherMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1a26,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0,
  });

  const packetGroup = new THREE.Group();
  const plainCapsule = new THREE.Mesh(capsuleGeometry, plainMaterial);
  const cipherCapsule = new THREE.Mesh(capsuleGeometry, cipherMaterial);
  plainCapsule.rotation.z = Math.PI / 2;
  cipherCapsule.rotation.z = Math.PI / 2;
  packetGroup.add(plainCapsule, cipherCapsule);
  scene.add(packetGroup);

  const noiseParticles = new THREE.BufferGeometry();
  const noiseCount = quality === "low" ? 30 : 60;
  const noisePositions = new Float32Array(noiseCount * 3);
  for (let i = 0; i < noiseCount; i += 1) {
    noisePositions[i * 3] = (Math.random() - 0.5) * 0.4;
    noisePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
    noisePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  noiseParticles.setAttribute("position", new THREE.BufferAttribute(noisePositions, 3));
  const noiseMaterial = new THREE.PointsMaterial({
    color: 0x9fe7ff,
    size: quality === "low" ? 0.02 : 0.025,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const noisePoints = new THREE.Points(noiseParticles, noiseMaterial);
  plainCapsule.add(noisePoints);

  const loader = new THREE.TextureLoader();
  const lockTexture = loader.load("../../lock-removebg-preview.png");
  lockTexture.colorSpace = THREE.SRGBColorSpace;
  const lockSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lockTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  lockSprite.scale.set(0.45, 0.45, 1);
  lockSprite.position.set(0, 0.28, 0.1);
  cipherCapsule.add(lockSprite);

  const hackerTexture = loader.load("../../hacker-removebg-preview.png");
  hackerTexture.colorSpace = THREE.SRGBColorSpace;
  const hackerSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: hackerTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  hackerSprite.scale.set(1.4, 1.4, 1);
  hackerSprite.position.set(-0.6, -1.05, -0.9);
  scene.add(hackerSprite);

  const probeGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.6, -0.9, -0.7),
    new THREE.Vector3(-0.1, -0.2, 0),
  ]);
  const probeMaterial = new THREE.LineBasicMaterial({
    color: 0x59f7ff,
    transparent: true,
    opacity: 0.35,
  });
  const probeLine = new THREE.Line(probeGeometry, probeMaterial);
  scene.add(probeLine);

  const glitchTexture = createRadialTexture([
    { stop: 0, color: "rgba(89, 247, 255, 0.6)" },
    { stop: 0.5, color: "rgba(89, 247, 255, 0.25)" },
    { stop: 1, color: "rgba(89, 247, 255, 0)" },
  ]);
  const glitchSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glitchTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glitchSprite.scale.set(0.9, 0.9, 1);
  glitchSprite.position.set(-0.2, -0.5, -0.2);
  scene.add(glitchSprite);

  const ambient = new THREE.AmbientLight(0x8aa7c2, 0.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.8);
  keyLight.position.set(2, 2, 3.5);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1, 8);
  rim.position.set(-2, 0.4, 2);
  scene.add(rim);

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();

  const renderFrame = (staticFrame = false) => {
    resizeRendererToDisplaySize(renderer, camera);

    const elapsed = staticFrame ? 0 : clock.getElapsedTime();
    const cycle = 6;
    const t = (elapsed % cycle) / cycle;

    const eased = t < 0.5
      ? easeInOutSine(t * 2) * 0.5
      : 0.5 + easeInOutSine((t - 0.5) * 2) * 0.5;

    const x = lerp(-tunnelLength / 2 + 0.5, tunnelLength / 2 - 0.5, eased);
    packetGroup.position.set(x, Math.sin(elapsed * 1.2) * 0.05, 0);

    const encryptPhase = clamp((t - 0.46) / 0.1, 0, 1);
    plainMaterial.opacity = 1 - encryptPhase;
    cipherMaterial.opacity = encryptPhase;

    const flicker = 0.4 + Math.sin(elapsed * 9) * 0.15;
    plainMaterial.emissiveIntensity = 0.2 + flicker * 0.4;
    noiseMaterial.opacity = 0.35 + flicker * 0.25;

    const pulse = Math.exp(-Math.pow((t - 0.5) * 10, 2));
    boundaryRing.material.emissiveIntensity = 0.3 + pulse * 0.9;
    boundaryRing.scale.setScalar(1 + pulse * 0.2);
    pulseSprite.material.opacity = 0.15 + pulse * 0.65;

    const peek = clamp((t - 0.1) / 0.2, 0, 1) * (1 - clamp((t - 0.55) / 0.2, 0, 1));
    hackerSprite.material.opacity = 0.25 + peek * 0.55;
    probeMaterial.opacity = (1 - encryptPhase) * 0.4;

    const glitchPhase = clamp((t - 0.55) / 0.15, 0, 1);
    glitchSprite.material.opacity =
      glitchPhase * (0.2 + Math.abs(Math.sin(elapsed * 16)) * 0.6);

    camera.position.z = 6.2;
    camera.lookAt(0, 0, 0);

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
    renderer.dispose();
    capsuleGeometry.dispose();
    noiseParticles.dispose();
    noiseMaterial.dispose();
  };

  return {
    start,
    stop,
    dispose,
    onResize: () => resizeRendererToDisplaySize(renderer, camera),
    renderStatic: () => renderFrame(true),
  };
};
