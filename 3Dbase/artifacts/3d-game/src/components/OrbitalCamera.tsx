import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface OrbitalCameraProps {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export function OrbitalCamera({
  autoRotate = true,
  autoRotateSpeed = 0.3,
}: OrbitalCameraProps) {
  const { camera, gl } = useThree();

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical(18, Math.PI / 4, 0));
  const targetSpherical = useRef(new THREE.Spherical(18, Math.PI / 4, 0));
  const autoRotateAngle = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      targetSpherical.current.theta -= dx * 0.005;
      targetSpherical.current.phi -= dy * 0.005;
      targetSpherical.current.phi = Math.max(0.1, Math.min(Math.PI / 2.2, targetSpherical.current.phi));
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetSpherical.current.radius += e.deltaY * 0.02;
      targetSpherical.current.radius = Math.max(6, Math.min(35, targetSpherical.current.radius));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      targetSpherical.current.theta -= dx * 0.005;
      targetSpherical.current.phi -= dy * 0.005;
      targetSpherical.current.phi = Math.max(0.1, Math.min(Math.PI / 2.2, targetSpherical.current.phi));
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (autoRotate && !isDragging.current) {
      targetSpherical.current.theta -= autoRotateSpeed * delta;
    }

    spherical.current.theta += (targetSpherical.current.theta - spherical.current.theta) * 0.08;
    spherical.current.phi += (targetSpherical.current.phi - spherical.current.phi) * 0.08;
    spherical.current.radius += (targetSpherical.current.radius - spherical.current.radius) * 0.08;

    const pos = new THREE.Vector3();
    pos.setFromSpherical(spherical.current);
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
