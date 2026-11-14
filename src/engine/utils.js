import * as THREE from "three";

export function spherePoint(radius, polarDeg, azimuthDeg) {
  const polar = THREE.MathUtils.degToRad(polarDeg);
  const azimuth = THREE.MathUtils.degToRad(azimuthDeg);
  const y = radius * Math.cos(polar);
  const r = radius * Math.sin(polar);
  const x = r * Math.sin(azimuth);
  const z = r * Math.cos(azimuth);
  return new THREE.Vector3(x, y, z);
}
