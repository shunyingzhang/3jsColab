"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { SalesCabinetModel, ScenePart } from "@/lib/cabinet/types";

export default function KitchenViewer({ cabinets }: { cabinets: SalesCabinetModel[] }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe4eaed);
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 16000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const textures = new Map<string, THREE.Texture>();
    const content = new THREE.Group();
    scene.add(content);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x626c72, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(2500, -2500, 4000);
    sun.castShadow = true;
    scene.add(sun);
    const grid = new THREE.GridHelper(8000, 80, 0x8f9aa0, 0xc7cfd3);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    cabinets.forEach((cabinet) => cabinet.parts.forEach((part) => content.add(createMesh(part, textures))));
    const bounds = new THREE.Box3().setFromObject(content);
    const center = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
    const size = bounds.isEmpty() ? new THREE.Vector3(1600, 800, 800) : bounds.getSize(new THREE.Vector3());
    const distance = Math.max(size.x, size.y, size.z, 900) * 1.8;
    controls.target.copy(center);
    camera.position.set(center.x + distance, center.y - distance, center.z + distance * 0.75);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cabinets]);

  return <div ref={mountRef} className="viewer" aria-label="可旋转的完整柜体外观预览" />;
}

function createMesh(part: ScenePart, textures: Map<string, THREE.Texture>) {
  const material = new THREE.MeshStandardMaterial({ roughness: part.kind === "handle" ? 0.25 : 0.72 });
  if ("textureUrl" in part.material && part.material.textureUrl) {
    let texture = textures.get(part.material.textureUrl);
    if (!texture) {
      texture = new THREE.TextureLoader().load(part.material.textureUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(part.kind === "benchtop" ? 3 : 1.1, part.kind === "benchtop" ? 2 : 1);
      textures.set(part.material.textureUrl, texture);
    }
    material.map = texture;
  } else if ("color" in part.material) {
    material.color.set(part.material.color);
    material.metalness = part.kind === "handle" ? 0.78 : 0;
  }

  const mesh = new THREE.Mesh(createPartGeometry(part), material);
  mesh.name = part.id;
  mesh.position.set(part.position.x, part.position.y, part.position.z);
  mesh.rotation.z = part.rotationZ;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createPartGeometry(part: ScenePart): THREE.BufferGeometry {
  if (part.geometry?.type === "rounded-box") {
    const halfWidth = part.size.width / 2;
    const halfDepth = part.size.depth / 2;
    const maxRadius = Math.min(halfWidth, halfDepth);
    const radii = {
      frontRight: Math.min(Math.max(0, part.geometry.radii.frontRight), maxRadius),
      backRight: Math.min(Math.max(0, part.geometry.radii.backRight), maxRadius),
      backLeft: Math.min(Math.max(0, part.geometry.radii.backLeft), maxRadius),
      frontLeft: Math.min(Math.max(0, part.geometry.radii.frontLeft), maxRadius),
    };
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth + radii.frontLeft, -halfDepth);
    shape.lineTo(halfWidth - radii.frontRight, -halfDepth);
    shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radii.frontRight);
    shape.lineTo(halfWidth, halfDepth - radii.backRight);
    shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radii.backRight, halfDepth);
    shape.lineTo(-halfWidth + radii.backLeft, halfDepth);
    shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radii.backLeft);
    shape.lineTo(-halfWidth, -halfDepth + radii.frontLeft);
    shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radii.frontLeft, -halfDepth);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: part.size.height, bevelEnabled: false });
    geometry.translate(0, 0, -part.size.height / 2);
    return geometry;
  }
  if (part.geometry?.type === "slanted-plate") {
    const geometry = new THREE.BoxGeometry(part.size.width, part.size.depth, part.size.height);
    geometry.rotateX(part.geometry.angleDegrees * Math.PI / 180);
    return geometry;
  }
  if (part.geometry?.type === "c-profile") {
    const width = part.size.depth;
    const height = part.size.height;
    const wall = Math.min(part.geometry.wall, width / 3, height / 3);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, wall);
    shape.lineTo(wall, wall);
    shape.lineTo(wall, height - wall);
    shape.lineTo(width, height - wall);
    shape.lineTo(width, height);
    shape.lineTo(0, height);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: part.size.width, bevelEnabled: false });
    geometry.translate(-part.size.depth / 2, -part.size.height / 2, -part.size.width / 2);
    geometry.rotateY(Math.PI / 2);
    return geometry;
  }
  if (part.kind === "adjustable-leg") {
    const geometry = new THREE.CylinderGeometry(part.size.width / 2, part.size.width / 2, part.size.height, 24);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  if (part.geometry?.type === "cylinder") {
    const axis = part.geometry.axis ?? "z";
    const length = axis === "x" ? part.size.width : axis === "y" ? part.size.depth : part.size.height;
    const radius = Math.min(part.size.width, part.size.height) / 2;
    const geometry = new THREE.CylinderGeometry(
      part.geometry.radiusTop ?? radius,
      part.geometry.radiusBottom ?? radius,
      length,
      part.geometry.radialSegments ?? 24,
    );
    if (axis === "x") geometry.rotateZ(Math.PI / 2);
    if (axis === "z") geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  return new THREE.BoxGeometry(part.size.width, part.size.depth, part.size.height);
}
