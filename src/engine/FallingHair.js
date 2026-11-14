import * as THREE from "three";

const GRAVITY = -2.4;
const MAX_PIECES = 60;

export class FallingHairSystem {
  constructor(floorY = 0) {
    this.group = new THREE.Group();
    this.group.name = "fallingHair";
    this.pieces = [];
    this.floorY = floorY;
    this.pileMap = new Map();
    this.pileGroup = new THREE.Group();
    this.group.add(this.pileGroup);
  }

  spawn(worldPos, color, amount) {
    if (this.pieces.length > MAX_PIECES) {
      const old = this.pieces.shift();
      this.group.remove(old.mesh);
    }
    const geo = new THREE.BoxGeometry(0.03, 0.01, 0.06 + amount * 0.05);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPos);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.group.add(mesh);
    this.pieces.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.3, Math.random() * 0.2, (Math.random() - 0.5) * 0.3),
      angVel: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(4),
      settled: false,
      color,
    });
  }

  update(dt) {
    for (const p of this.pieces) {
      if (p.settled) continue;
      p.vel.y += GRAVITY * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.angVel.x * dt;
      p.mesh.rotation.y += p.angVel.y * dt;
      p.mesh.rotation.z += p.angVel.z * dt;
      if (p.mesh.position.y <= this.floorY + 0.005) {
        p.mesh.position.y = this.floorY + 0.005;
        p.settled = true;
        this._addToPile(p.mesh.position, p.color);
        this.group.remove(p.mesh);
      }
    }
    this.pieces = this.pieces.filter((p) => !p.settled);
  }

  _cellKey(pos) {
    const gx = Math.round(pos.x / 0.22);
    const gz = Math.round(pos.z / 0.22);
    return `${gx}_${gz}`;
  }

  _addToPile(pos, color) {
    const key = this._cellKey(pos);
    let entry = this.pileMap.get(key);
    if (!entry) {
      const geo = new THREE.CylinderGeometry(0.1, 0.12, 0.02, 10);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(Math.round(pos.x / 0.22) * 0.22, this.floorY + 0.01, Math.round(pos.z / 0.22) * 0.22);
      this.pileGroup.add(mesh);
      entry = { mesh, height: 0.02, color: new THREE.Color(color) };
      this.pileMap.set(key, entry);
    }
    entry.height = Math.min(entry.height + 0.012, 0.22);
    entry.mesh.scale.y = entry.height / 0.02;
    entry.mesh.position.y = this.floorY + entry.height / 2;
    entry.color.lerp(new THREE.Color(color), 0.3);
    entry.mesh.material.color.copy(entry.color);
  }

  sweep() {
    for (const { mesh } of this.pileMap.values()) this.pileGroup.remove(mesh);
    this.pileMap.clear();
    for (const p of this.pieces) this.group.remove(p.mesh);
    this.pieces = [];
  }
}
