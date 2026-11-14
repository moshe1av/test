import * as THREE from "three";
import { spherePoint } from "./utils.js";

export function buildHead(character) {
  const group = new THREE.Group();
  group.name = "headRig";

  const radius = 0.62;
  const headGeo = new THREE.SphereGeometry(radius, 28, 20);
  headGeo.scale(0.92, 1.08, 0.95);
  const headMat = new THREE.MeshStandardMaterial({ color: character.skinTone, roughness: 0.85, metalness: 0.02 });
  const head = new THREE.Mesh(headGeo, headMat);
  group.add(head);

  const earGeo = new THREE.SphereGeometry(0.09, 10, 10);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, headMat);
    ear.scale.set(0.6, 1, 0.8);
    ear.position.copy(spherePoint(radius * 0.98, 92, side * 90));
    group.add(ear);
  }

  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.3 });
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.copy(spherePoint(radius * 1.01, 78, side * 22));
    group.add(eye);
    eyes.push(eye);
  }

  const browGeo = new THREE.BoxGeometry(0.12, 0.03, 0.03);
  const browMat = new THREE.MeshStandardMaterial({ color: character.hairColor });
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(browGeo, browMat);
    brow.position.copy(spherePoint(radius * 1.02, 68, side * 22));
    brow.rotation.z = side * 0.25;
    group.add(brow);
  }

  const noseGeo = new THREE.ConeGeometry(0.05, 0.12, 8);
  const nose = new THREE.Mesh(noseGeo, headMat);
  nose.position.copy(spherePoint(radius * 1.0, 88, 0));
  nose.rotation.x = Math.PI / 2.3;
  group.add(nose);

  const mouthGeo = new THREE.TorusGeometry(0.07, 0.012, 6, 12, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8a3b3b });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.copy(spherePoint(radius * 1.0, 102, 0));
  mouth.rotation.x = 0.3;
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  if (character.facialHair) {
    const beardGeo = new THREE.SphereGeometry(radius * 0.7, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4);
    const beardMat = new THREE.MeshStandardMaterial({ color: character.facialHair.color, roughness: 0.95 });
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.y = -radius * 0.25;
    beard.position.z = radius * 0.05;
    beard.scale.set(0.9, 0.8 + character.facialHair.length, 0.8);
    group.add(beard);
  }

  group.userData.eyes = eyes;
  group.userData.headRadius = radius;

  return group;
}
