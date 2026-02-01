import {
  THREE,
  clamp,
  createGlowTexture,
  createRenderer,
  easeOutCubic,
  resizeRendererToDisplaySize,
} from "./utils.js";

export const init = (canvas, options = {}) => {
  const { prefersReducedMotion, quality = "high", onHover } = options;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 5, 16);

  const camera = new THREE.PerspectiveCamera(
    42,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    40
  );
  camera.position.set(0, 1.3, 6.4);

  const renderer = createRenderer(canvas);

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1525,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0x59f7ff,
    emissiveIntensity: 0.25,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 32), coreMaterial);
  base.position.y = -0.1;
  coreGroup.add(base);

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.9, 32), coreMaterial);
  tower.position.y = 0.55;
  coreGroup.add(tower);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x0d1c2c,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    })
  );
  screen.position.set(0, 0.6, 0.38);
  coreGroup.add(screen);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.03, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0x0a1a28,
      emissive: 0x59f7ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5,
    })
  );
  ring.rotation.x = Math.PI / 2;
  coreGroup.add(ring);

  const ambient = new THREE.AmbientLight(0x8da7c4, 0.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5dcff, 0.9);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0x59f7ff, 1.1, 10);
  rim.position.set(-3, 1, 2);
  scene.add(rim);

  const nodeCount = 6;
  const nodes = [];
  const arcs = [];
  const telemetryDots = [];
  const radius = 2.6;
  const dotTexture = createGlowTexture();

  for (let i = 0; i < nodeCount; i += 1) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const target = new THREE.Vector3(
      Math.cos(angle) * radius,
      (i % 2 === 0 ? 0.35 : -0.15),
      Math.sin(angle) * radius * 0.6
    );

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(quality === "low" ? 0.16 : 0.2, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0d1a28,
        emissive: 0x59f7ff,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.2,
      })
    );

    node.userData = {
      target,
      label: `Sensor Node ${i + 1}`,
      status: "Encrypted uplink",
      crypto: "LWC / AEAD",
    };
    nodes.push(node);
    scene.add(node);

    const mid = target.clone().multiplyScalar(0.5);
    mid.y += 0.9;
    const curve = new THREE.CatmullRomCurve3([
      target,
      mid,
      new THREE.Vector3(0, 0, 0),
    ]);

    const points = curve.getPoints(60);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x59f7ff,
      dashSize: 0.08,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.35,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.geometry.setDrawRange(0, 0);
    arcs.push({ line, curve, pointsCount: points.length });
    scene.add(line);

    const dot = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: dotTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    dot.scale.set(0.18, 0.18, 1);
    dot.userData = {
      progress: Math.random(),
      speed: 0.15 + Math.random() * 0.12,
      curve,
    };
    telemetryDots.push(dot);
    scene.add(dot);
  }

  let running = false;
  let raf = null;
  const clock = new THREE.Clock();
  let introStart = null;
  let hasIntroduced = false;

  const renderFrame = (staticFrame = false) => {
    resizeRendererToDisplaySize(renderer, camera);

    const delta = staticFrame ? 0 : clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (!hasIntroduced) {
      if (introStart === null) {
        introStart = elapsed;
      }
      const progress = clamp((elapsed - introStart) / 1.8, 0, 1);
      const eased = easeOutCubic(progress);

      nodes.forEach((node) => {
        const target = node.userData.target;
        node.position.lerpVectors(
          new THREE.Vector3(0, -0.6, -2.2),
          target,
          eased
        );
      });

      arcs.forEach(({ line, pointsCount }) => {
        line.geometry.setDrawRange(0, Math.floor(pointsCount * eased));
        line.material.opacity = 0.15 + eased * 0.35;
      });

      if (progress >= 1) {
        hasIntroduced = true;
      }
    } else {
      arcs.forEach(({ line }) => {
        line.material.dashOffset = -elapsed * 0.6;
      });
    }

    telemetryDots.forEach((dot) => {
      dot.userData.progress += dot.userData.speed * delta;
      if (dot.userData.progress > 1) {
        dot.userData.progress = 0;
      }
      const point = dot.userData.curve.getPointAt(dot.userData.progress);
      dot.position.copy(point);
    });

    const pulse = 1 + Math.sin(elapsed * 1.8) * 0.05;
    ring.scale.setScalar(pulse);
    ring.material.opacity = 0.35 + Math.abs(Math.sin(elapsed * 1.2)) * 0.25;

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

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const handlePointerMove = (event) => {
    if (!onHover) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodes, false);
    if (hits.length > 0) {
      const node = hits[0].object;
      onHover({
        name: node.userData.label,
        status: node.userData.status,
        crypto: node.userData.crypto,
        x: event.clientX,
        y: event.clientY,
      });
    } else {
      onHover(null);
    }
  };

  const handlePointerLeave = () => {
    onHover?.(null);
  };

  if (onHover) {
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
  }

  const dispose = () => {
    stop();
    renderer.dispose();
    if (onHover) {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    }
  };

  return {
    start,
    stop,
    dispose,
    onResize: () => resizeRendererToDisplaySize(renderer, camera),
    renderStatic: () => renderFrame(true),
  };
};
