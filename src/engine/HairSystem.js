import * as THREE from "three";
import { spherePoint } from "./utils.js";

const SCALP_RADIUS = 0.66;

const ZONE_META = {
  top: { baseCount: 170, polar: [0, 28], azimuth: [-180, 180] },
  fringe: { baseCount: 90, polar: [28, 58], azimuth: [-45, 45] },
  leftSide: { baseCount: 110, polar: [28, 96], azimuth: [-135, -45] },
  rightSide: { baseCount: 110, polar: [28, 96], azimuth: [45, 135] },
  back: { baseCount: 140, polar: [28, 100], azimuth: [135, 225] },
};

function randomPolarAzimuth(meta) {
  const [p0, p1] = meta.polar;
  const cosMax = Math.cos(THREE.MathUtils.degToRad(p0));
  const cosMin = Math.cos(THREE.MathUtils.degToRad(p1));
  const cosP = THREE.MathUtils.lerp(cosMax, cosMin, Math.random());
  const polarDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(cosP, -1, 1)));
  const [a0, a1] = meta.azimuth;
  let azimuthDeg = THREE.MathUtils.lerp(a0, a1, Math.random());
  if (azimuthDeg > 180) azimuthDeg -= 360;
  return { polarDeg, azimuthDeg };
}

export class HairSystem {
  constructor(character) {
    this.character = character;
    this.group = new THREE.Group();
    this.group.name = "hairSystem";

    this.zones = {};
    this.meshes = {};
    this.zoneData = {};
    this.swayOffset = new THREE.Vector3();
    this.swayVelocity = new THREE.Vector3();
    this.styleHold = 0;

    this.proxy = new THREE.Mesh(
      new THREE.SphereGeometry(SCALP_RADIUS, 16, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.group.add(this.proxy);

    this._buildZones();
  }

  _buildZones() {
    const strandGeo = new THREE.CylinderGeometry(0.0035, 0.011, 1, 4, 1);
    strandGeo.translate(0, 0.5, 0);

    for (const zoneKey of Object.keys(ZONE_META)) {
      const meta = ZONE_META[zoneKey];
      const count = Math.max(20, Math.round(meta.baseCount * this.character.density));
      const curl = this.character.curl;
      const length = this.character.lengths[zoneKey] ?? 0.4;
      const maxLength = this.character.maxLength;

      this.zones[zoneKey] = {
        length,
        maxLength,
        baseColor: new THREE.Color(this.character.hairColor),
        wet: false,
        curl,
        styled: false,
      };

      const anchors = [];
      const dirs = [];
      for (let i = 0; i < count; i++) {
        const { polarDeg, azimuthDeg } = randomPolarAzimuth(meta);
        const anchor = spherePoint(SCALP_RADIUS, polarDeg, azimuthDeg);
        anchors.push(anchor);
        dirs.push(this._jitterDir(anchor.clone().normalize(), curl));
      }
      this.zoneData[zoneKey] = { anchors, dirs, count };

      const material = new THREE.MeshStandardMaterial({ color: this.character.hairColor, roughness: 0.75 });
      const mesh = new THREE.InstancedMesh(strandGeo, material, count);
      mesh.name = `hair_${zoneKey}`;
      this.meshes[zoneKey] = mesh;
      this.group.add(mesh);

      this._updateZoneInstances(zoneKey);
    }
  }

  _jitterDir(normal, curl) {
    const dir = normal.clone();
    if (curl > 0) {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const angle = (Math.random() - 0.5) * curl * 1.4;
      dir.applyAxisAngle(axis, angle);
    }
    return dir.normalize();
  }

  _updateZoneInstances(zoneKey) {
    const zone = this.zones[zoneKey];
    const { anchors, dirs, count } = this.zoneData[zoneKey];
    const mesh = this.meshes[zoneKey];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const lenFactor = zone.length / zone.maxLength;
    const swayScale = lenFactor * 0.35 * (1 - this.styleHold);

    for (let i = 0; i < count; i++) {
      const anchor = anchors[i];
      const dir = dirs[i];
      const bendAmount = THREE.MathUtils.clamp(lenFactor * 0.6, 0, 0.6);
      const bentDir = dir.clone().lerp(new THREE.Vector3(0, -1, 0), bendAmount).normalize();

      q.setFromUnitVectors(up, bentDir);
      const pos = anchor.clone().addScaledVector(this.swayOffset, swayScale);
      const visibleLength = Math.max(zone.length, 0.012);
      m.compose(pos, q, new THREE.Vector3(1, visibleLength, 1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = zone.length > 0.008;

    const color = zone.wet ? zone.baseColor.clone().multiplyScalar(0.65) : zone.baseColor;
    mesh.material.color.copy(color);
  }

  classifyPoint(localPoint) {
    const r = localPoint.length() || 1;
    const polarDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(localPoint.y / r, -1, 1)));
    const azimuthDeg = THREE.MathUtils.radToDeg(Math.atan2(localPoint.x, localPoint.z));
    if (polarDeg <= 28) return "top";
    if (Math.abs(azimuthDeg) <= 45) return "fringe";
    if (Math.abs(azimuthDeg) >= 135) return "back";
    return azimuthDeg < 0 ? "leftSide" : "rightSide";
  }

  cutZone(zoneKey, amount) {
    const zone = this.zones[zoneKey];
    const before = zone.length;
    zone.length = THREE.MathUtils.clamp(zone.length - amount, 0, zone.maxLength);
    const delta = before - zone.length;
    if (delta > 0.0005) this._updateZoneInstances(zoneKey);
    return { delta, color: (zone.wet ? zone.baseColor.clone().multiplyScalar(0.65) : zone.baseColor).clone() };
  }

  growZone(zoneKey, amount) {
    const zone = this.zones[zoneKey];
    zone.length = THREE.MathUtils.clamp(zone.length + amount, 0, zone.maxLength);
    this._updateZoneInstances(zoneKey);
  }

  setZoneWet(zoneKey, wet) {
    const zone = this.zones[zoneKey];
    if (zone.wet === wet) return;
    zone.wet = wet;
    this._updateZoneInstances(zoneKey);
  }

  setZoneColor(zoneKey, hex) {
    const keys = zoneKey === "all" ? Object.keys(this.zones) : [zoneKey];
    for (const k of keys) {
      this.zones[k].baseColor = new THREE.Color(hex);
      this._updateZoneInstances(k);
    }
  }

  setZoneCurl(zoneKey, curl) {
    const zone = this.zones[zoneKey];
    zone.curl = THREE.MathUtils.clamp(curl, 0, 1.2);
    const { anchors, dirs } = this.zoneData[zoneKey];
    for (let i = 0; i < anchors.length; i++) {
      dirs[i] = this._jitterDir(anchors[i].clone().normalize(), zone.curl);
    }
    this._updateZoneInstances(zoneKey);
  }

  setStyleHold(value) {
    this.styleHold = THREE.MathUtils.clamp(value, 0, 1);
  }

  applyForce(force) {
    this.swayVelocity.add(force);
  }

  update(dt) {
    if (this.swayVelocity.lengthSq() < 1e-7 && this.swayOffset.lengthSq() < 1e-7) return;
    this.swayVelocity.addScaledVector(this.swayOffset, -18 * dt);
    this.swayVelocity.multiplyScalar(Math.max(0, 1 - 6 * dt));
    this.swayOffset.addScaledVector(this.swayVelocity, dt);
    for (const zoneKey of Object.keys(this.zones)) this._updateZoneInstances(zoneKey);
  }

  getSnapshot() {
    const result = {};
    for (const k of Object.keys(this.zones)) {
      result[k] = { length: this.zones[k].length, color: `#${this.zones[k].baseColor.getHexString()}` };
    }
    return result;
  }
}
