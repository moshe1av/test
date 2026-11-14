import * as THREE from "three";

export function buildBarbershop() {
  const group = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 32),
    new THREE.MeshStandardMaterial({ color: 0xcdbfa8, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 4),
    new THREE.MeshStandardMaterial({ color: 0xe9ded0, roughness: 1 })
  );
  wall.position.set(0, 2, -1.6);
  group.add(wall);

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xbfd6dd, metalness: 0.3, roughness: 0.15 })
  );
  mirror.position.set(0, 1.9, -1.55);
  group.add(mirror);

  const chair = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
  );
  base.position.y = 0.45;
  chair.add(base);
  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x8c2f2f })
  );
  seat.position.y = 0.95;
  chair.add(seat);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.9, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x8c2f2f })
  );
  back.position.set(0, 1.5, -0.33);
  chair.add(back);
  group.add(chair);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 0.8);
  group.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(2, 3, 2.5);
  group.add(dir);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-2, 1.5, -1);
  group.add(fill);

  return group;
}
