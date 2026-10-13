import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { usePortfolio } from '../../context/ProfileContext';
import { useVisualSync } from '../../context/VisualSyncContext';
import FallbackPoster from './FallbackPoster';

/**
 * Generates a soft-glow circular radial gradient sprite texture for particles.
 * Combined with THREE.AdditiveBlending, this produces a performant 60 FPS bloom effect.
 */
function createParticleGlowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(0, 240, 255, 0.85)');
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
  gradient.addColorStop(0.8, 'rgba(16, 185, 129, 0.15)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

/**
 * LatentGalaxy
 * 3D Ambient WebGL Galaxy using Three.js.
 * Features:
 * - Dynamic particle nodes forming a latent space manifold with bloom glow
 * - Camera parallax responding smoothly to mouse movement
 * - Semantic skill cluster highlighting & glowing spline connections to related project nodes
 * - Automatic animation suspension on tab hidden (document.hidden) or viewport exit (IntersectionObserver)
 * - Graceful degradation on prefers-reduced-motion, low GPU concurrency, or unsupported WebGL
 */
const LatentGalaxy = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const { skills = [], projects = [] } = usePortfolio();
  const { activeSkill, activeCategory } = useVisualSync();

  const [isSupported, setIsSupported] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Cluster coordinate definitions in 3D space
  const clusterDefinitions = useMemo(() => [
    { id: 'ml', name: 'Machine Learning & Deep Learning', center: new THREE.Vector3(-25, 15, -10), color: new THREE.Color('#00f0ff') },
    { id: 'cv', name: 'Computer Vision & Perception', center: new THREE.Vector3(22, 18, 5), color: new THREE.Color('#38bdf8') },
    { id: 'robotics', name: 'Robotics & Autonomous Systems', center: new THREE.Vector3(18, -20, -15), color: new THREE.Color('#f59e0b') },
    { id: 'systems', name: 'Software Engineering & Cloud', center: new THREE.Vector3(-20, -16, 10), color: new THREE.Color('#a855f7') },
    { id: 'foundation', name: 'Core Foundations', center: new THREE.Vector3(0, 0, 0), color: new THREE.Color('#10b981') },
  ], []);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        setIsReducedMotion(true);
      }
    }

    // 2. Check low GPU / hardware concurrency
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1) {
      setIsReducedMotion(true);
    }
  }, []);

  // WebGL 3D Scene Controller
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Check WebGL Context Availability
    let gl = null;
    try {
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
      setIsSupported(false);
      return;
    }

    if (!gl) {
      setIsSupported(false);
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    } catch (err) {
      console.warn('WebGLRenderer initialization failed, degrading to static poster:', err);
      setIsSupported(false);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      1000
    );
    camera.position.z = 75;

    // -------------------------------------------------------------
    // 1. Ambient Particle Galaxy Construction
    // -------------------------------------------------------------
    const particleCount = 1200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseColors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const baseSizes = new Float32Array(particleCount);

    const texture = createParticleGlowTexture();
    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    const palette = [
      new THREE.Color('#00f0ff'), // Electric Cyan
      new THREE.Color('#a855f7'), // Neon Purple
      new THREE.Color('#10b981'), // Emerald
      new THREE.Color('#38bdf8'), // Sky Blue
      new THREE.Color('#f59e0b'), // Amber
      new THREE.Color('#64748b'), // Slate Dim
    ];

    // Distribute particles in a spiral latent space manifold
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spiral arms with gaussian radial distribution
      const branchAngle = ((i % 3) * (2 * Math.PI)) / 3;
      const radius = Math.pow(Math.random(), 1.5) * 55 + 2;
      const spinAngle = radius * 0.12;

      const randomX = (Math.random() - 0.5) * (radius * 0.35 + 2);
      const randomY = (Math.random() - 0.5) * (radius * 0.25 + 2);
      const randomZ = (Math.random() - 0.5) * (radius * 0.35 + 2);

      const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
      const y = Math.sin(branchAngle + spinAngle) * (radius * 0.3) + randomY;
      const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Color selection: core is bright cyan, outer reaches are neon purple & slate
      const col = palette[Math.floor(Math.random() * palette.length)].clone();
      if (radius < 15) {
        col.lerp(new THREE.Color('#ffffff'), 0.5);
      }

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      baseColors[i3] = col.r;
      baseColors[i3 + 1] = col.g;
      baseColors[i3 + 2] = col.b;

      const pSize = Math.random() * 2.0 + 1.2;
      sizes[i] = pSize;
      baseSizes[i] = pSize;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // -------------------------------------------------------------
    // 2. Project Nodes in Galaxy
    // -------------------------------------------------------------
    const projectNodes = [];
    const projectCount = Math.max(projects.length, 4);
    for (let p = 0; p < projectCount; p++) {
      const proj = projects[p] || { title: `Project-${p}`, tags: [] };
      const angle = (p / projectCount) * Math.PI * 2 + 0.5;
      const dist = 32 + (p % 2) * 12;
      const pos = new THREE.Vector3(
        Math.cos(angle) * dist,
        Math.sin(angle) * 15,
        Math.sin(angle) * dist * 0.5
      );

      // Sphere marker for project node
      const markerGeo = new THREE.SphereGeometry(0.8, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#a855f7'),
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);
      scene.add(markerMesh);

      projectNodes.push({
        project: proj,
        position: pos,
        mesh: markerMesh,
      });
    }

    // -------------------------------------------------------------
    // 3. Dynamic Spline Lines Group (Capabilities -> Project Connections)
    // -------------------------------------------------------------
    const splineGroup = new THREE.Group();
    scene.add(splineGroup);

    // -------------------------------------------------------------
    // 4. Parallax & Motion Controls
    // -------------------------------------------------------------
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (event) => {
      const winW = window.innerWidth || 1;
      const winH = window.innerHeight || 1;
      targetMouseX = ((event.clientX - winW / 2) / (winW / 2)) * 12;
      targetMouseY = ((event.clientY - winH / 2) / (winH / 2)) * 10;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // 5. Visibility & Viewport Suspension Logic
    // -------------------------------------------------------------
    let isDocumentVisible = !document.hidden;
    let isIntersecting = true;
    let animationFrameId = null;
    let isRunning = false;

    const renderFrame = (timestamp = 0) => {
      const t = timestamp * 0.001;

      // Parallax smoothing (LERP)
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      camera.position.x = currentMouseX;
      camera.position.y = -currentMouseY;
      camera.lookAt(0, 0, 0);

      // Ambient Galaxy Rotation
      if (particleSystem) {
        particleSystem.rotation.y = t * 0.05;
        particleSystem.rotation.x = Math.sin(t * 0.03) * 0.08;
      }

      // Spline group rotation sync
      if (splineGroup) {
        splineGroup.rotation.y = particleSystem.rotation.y;
        splineGroup.rotation.x = particleSystem.rotation.x;
      }

      // Pulsing project node markers
      for (let p = 0; p < projectNodes.length; p++) {
        const node = projectNodes[p];
        const pulse = 1.0 + Math.sin(t * 2 + p) * 0.25;
        node.mesh.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    const animateLoop = (timestamp) => {
      if (!isRunning) return;
      renderFrame(timestamp);
      animationFrameId = requestAnimationFrame(animateLoop);
    };

    const startAnimation = () => {
      if (isRunning || isReducedMotion) return;
      isRunning = true;
      animationFrameId = requestAnimationFrame(animateLoop);
    };

    const stopAnimation = () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    // Document Visibility Suspension
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (!isDocumentVisible) {
        stopAnimation();
      } else if (isIntersecting && !isReducedMotion) {
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Viewport IntersectionObserver Suspension
    let observer = null;
    if (typeof window !== 'undefined' && window.IntersectionObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          if (!isIntersecting) {
            stopAnimation();
          } else if (isDocumentVisible && !isReducedMotion) {
            startAnimation();
          }
        },
        { threshold: 0.01 }
      );
      observer.observe(container);
    }

    // Single static render if reduced motion is requested
    if (isReducedMotion) {
      renderFrame(0);
    } else {
      startAnimation();
    }

    // Store references on canvas element for activeSkill synchronization effect
    canvas.__galaxyState = {
      scene,
      splineGroup,
      clusterDefinitions,
      projectNodes,
      particleGeometry,
      positions,
      colors,
      baseColors,
      particleCount,
    };

    // -------------------------------------------------------------
    // Cleanup & Disposal
    // -------------------------------------------------------------
    return () => {
      stopAnimation();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) observer.disconnect();

      // Clear dynamic splines
      while (splineGroup.children.length > 0) {
        const obj = splineGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        splineGroup.remove(obj);
      }

      // Dispose project markers
      projectNodes.forEach((node) => {
        if (node.mesh.geometry) node.mesh.geometry.dispose();
        if (node.mesh.material) node.mesh.material.dispose();
        scene.remove(node.mesh);
      });

      // Dispose particles
      if (particleGeometry) particleGeometry.dispose();
      if (particleMaterial) particleMaterial.dispose();
      if (texture) texture.dispose();
      scene.remove(particleSystem);

      if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) {
          renderer.forceContextLoss();
        }
      }
    };
  }, [isReducedMotion, clusterDefinitions, projects]);

  // ---------------------------------------------------------------
  // Synchronize Active Skill Highlight & Spline Connections
  // ---------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.__galaxyState) return;

    const {
      splineGroup,
      clusterDefinitions: defs,
      projectNodes,
      particleGeometry,
      positions,
      colors,
      baseColors,
      particleCount,
    } = canvas.__galaxyState;

    // 1. Remove previous splines
    while (splineGroup.children.length > 0) {
      const child = splineGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      splineGroup.remove(child);
    }

    if (!activeSkill) {
      // Restore all particle base colors
      for (let i = 0; i < particleCount * 3; i++) {
        colors[i] = baseColors[i];
      }
      particleGeometry.attributes.color.needsUpdate = true;
      return;
    }

    // 2. Locate target cluster
    const cluster =
      defs.find((c) => activeCategory && c.name.toLowerCase().includes(activeCategory.toLowerCase())) ||
      defs.find((c) => c.name.toLowerCase().includes('learning')) ||
      defs[0];

    const clusterCenter = cluster ? cluster.center : new THREE.Vector3(0, 0, 0);
    const highlightColor = new THREE.Color('#00f0ff');

    // 3. Highlight particles in proximity to cluster center
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];

      const dx = px - clusterCenter.x;
      const dy = py - clusterCenter.y;
      const dz = pz - clusterCenter.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 28) {
        // Boost brightness and tint electric cyan
        colors[i3] = highlightColor.r;
        colors[i3 + 1] = highlightColor.g;
        colors[i3 + 2] = highlightColor.b;
      } else {
        // Dim other particles to create dramatic spotlight contrast
        colors[i3] = baseColors[i3] * 0.35;
        colors[i3 + 1] = baseColors[i3 + 1] * 0.35;
        colors[i3 + 2] = baseColors[i3 + 2] * 0.35;
      }
    }
    particleGeometry.attributes.color.needsUpdate = true;

    // 4. Construct glowing spline curves to related project nodes
    const lowerSkill = activeSkill.toLowerCase();
    const relatedProjects = projectNodes.filter((pn) => {
      const tags = Array.isArray(pn.project.tags)
        ? pn.project.tags
        : typeof pn.project.tags === 'string'
        ? pn.project.tags.split(',')
        : [];
      const hasTagMatch = tags.some((t) => t.toLowerCase().includes(lowerSkill) || lowerSkill.includes(t.toLowerCase().trim()));
      const hasTitleMatch = (pn.project.title || '').toLowerCase().includes(lowerSkill);
      return hasTagMatch || hasTitleMatch;
    });

    const targetNodes = relatedProjects.length > 0 ? relatedProjects : projectNodes.slice(0, 2);

    targetNodes.forEach((node) => {
      // Calculate smooth quadratic bezier control point arching outwards
      const midPoint = new THREE.Vector3().addVectors(clusterCenter, node.position).multiplyScalar(0.5);
      midPoint.y += 14;
      midPoint.z += 10;

      const curve = new THREE.QuadraticBezierCurve3(clusterCenter, midPoint, node.position);
      const points = curve.getPoints(36);
      const splineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const splineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#00f0ff'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });

      const splineLine = new THREE.Line(splineGeo, splineMat);
      splineGroup.add(splineLine);

      // Highlight target project node marker
      if (node.mesh && node.mesh.material) {
        node.mesh.material.color.set('#00f0ff');
        node.mesh.material.opacity = 1.0;
      }
    });
  }, [activeSkill, activeCategory]);

  return (
    <div
      ref={containerRef}
      data-testid="latent-galaxy-container"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Always render underlying fallback poster for seamless depth */}
      <FallbackPoster isReducedMotion={isReducedMotion} />

      {/* Render WebGL canvas on top when supported */}
      {isSupported && (
        <canvas
          ref={canvasRef}
          data-testid="latent-galaxy-canvas"
          className="absolute inset-0 w-full h-full block"
        />
      )}
    </div>
  );
};

export default LatentGalaxy;
