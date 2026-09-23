"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initCursor() {
  const cursor = document.querySelector(".cursor-dot");
  if (!cursor || window.matchMedia("(max-width: 640px)").matches || prefersReducedMotion) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.style.opacity = "1";
  });

  document.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("pointerenter", () => {
      cursor.style.width = "28px";
      cursor.style.height = "28px";
      cursor.style.background = "transparent";
      cursor.style.border = "1px solid var(--accent)";
    });

    item.addEventListener("pointerleave", () => {
      cursor.style.width = "12px";
      cursor.style.height = "12px";
      cursor.style.background = "var(--accent)";
      cursor.style.border = "0";
    });
  });

  function tick() {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    requestAnimationFrame(tick);
  }

  tick();
}

function initScrollAnimations() {
  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) {
    revealItems.forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(".site-header", { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" });

  revealItems.forEach((item) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        once: true
      }
    });
  });

  gsap.utils.toArray(".project-card").forEach((card) => {
    card.addEventListener("pointerenter", () => gsap.to(card, { scale: 1.012, duration: 0.24, ease: "power2.out" }));
    card.addEventListener("pointerleave", () => gsap.to(card, { scale: 1, duration: 0.24, ease: "power2.out" }));
  });
}

function initHeroScene() {
  const canvas = document.querySelector("#hero-canvas");
  const container = document.querySelector(".hero-visual");

  if (!canvas || !container || !window.THREE) return;
  window.__heroSceneStatus = "initializing";

  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));

  camera.position.set(0, 0, 5.6);

  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.IcosahedronGeometry(1.45, isMobile ? 2 : 3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6ee7c8,
    roughness: 0.46,
    metalness: 0.18,
    emissive: 0x0d3b35,
    emissiveIntensity: 0.3,
    wireframe: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const wire = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    })
  );
  wire.scale.setScalar(1.012);
  group.add(wire);

  const particleCount = isMobile ? 90 : 170;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.2 + Math.random() * 1.85;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: 0xf7b267,
      size: isMobile ? 0.018 : 0.024,
      transparent: true,
      opacity: 0.72
    })
  );
  group.add(particles);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xf28482, 1.8, 8);
  rimLight.position.set(-2.8, -1.5, 2);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0x6ee7c8, 0.34));

  const pointer = { x: 0, y: 0 };

  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function animate(time) {
    const seconds = time * 0.001;
    const drift = prefersReducedMotion ? 0 : seconds;

    group.rotation.y += ((pointer.x * 0.22) - group.rotation.y) * 0.035;
    group.rotation.x += ((-pointer.y * 0.18) - group.rotation.x) * 0.035;
    mesh.rotation.y = drift * 0.18;
    mesh.rotation.z = drift * 0.08;
    wire.rotation.y = -drift * 0.11;
    particles.rotation.y = drift * 0.045;
    particles.rotation.x = drift * 0.025;

    renderer.render(scene, camera);
    window.__heroSceneStatus = "rendered";
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
  initCursor();
  initScrollAnimations();
  initHeroScene();
});
