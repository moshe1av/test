import * as THREE from "three";
import { SceneManager } from "../engine/SceneManager.js";
import { buildHead } from "../engine/HeadBuilder.js";
import { HairSystem } from "../engine/HairSystem.js";
import { gameState, Screens, Modes } from "../state/GameState.js";
import { AudioEngine } from "../audio/AudioEngine.js";

export function renderShowcase(root, goTo) {
  root.innerHTML = "";
  const character = gameState.character;
  const result = gameState.result;

  const el = document.createElement("div");
  el.className = "screen showcase-screen";
  el.innerHTML = `
    <div class="showcase-canvas-host"></div>
    <div class="showcase-panel">
      <h2>${character.name} is ready!</h2>
      <div class="star-row"></div>
      <div class="showcase-actions">
        <button class="btn-secondary photo-btn">📸 Snapshot</button>
        <button class="btn-secondary again-btn">New Client</button>
        <button class="btn-primary replay-btn">Style Again</button>
      </div>
    </div>
  `;
  root.appendChild(el);

  const canvasHost = el.querySelector(".showcase-canvas-host");
  const sceneManager = new SceneManager(canvasHost);
  sceneManager.scene.background = new THREE.Color(0xfff3e6);
  sceneManager.scene.add(new THREE.HemisphereLight(0xffffff, 0x998877, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2, 3, 3);
  sceneManager.scene.add(dir);

  const rig = new THREE.Group();
  rig.position.set(0, 0.1, 0);
  sceneManager.scene.add(rig);

  const headRig = buildHead(character);
  rig.add(headRig);

  const hairSystem = new HairSystem(character);
  for (const [zoneKey, data] of Object.entries(result.snapshot)) {
    hairSystem.zones[zoneKey].length = data.length;
    hairSystem.setZoneColor(zoneKey, data.color);
  }
  rig.add(hairSystem.group);

  sceneManager.camera.position.set(0, 0.2, 2.6);
  sceneManager.camera.lookAt(0, 0.05, 0);

  let spin = 0;
  sceneManager.addUpdate((dt) => {
    spin += dt * 0.6;
    rig.rotation.y = spin;
  });
  sceneManager.start();

  const stars = computeStars(character, result, gameState.mode);
  const starRow = el.querySelector(".star-row");
  starRow.innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="star ${i < stars ? "filled" : ""}">★</span>`).join("");

  AudioEngine.finishFanfare();

  el.querySelector(".photo-btn").addEventListener("click", () => {
    AudioEngine.uiTap();
    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    const dataUrl = sceneManager.renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${character.name.toLowerCase().replace(/\s+/g, "-")}-haircut.png`;
    link.click();
  });

  el.querySelector(".again-btn").addEventListener("click", () => {
    sceneManager.dispose();
    AudioEngine.uiTap();
    goTo(Screens.CHARACTER_SELECT);
  });

  el.querySelector(".replay-btn").addEventListener("click", () => {
    sceneManager.dispose();
    AudioEngine.uiTap();
    gameState.resetStats();
    goTo(Screens.GAMEPLAY);
  });
}

function computeStars(character, result, mode) {
  if (mode === Modes.CHALLENGE) {
    const target = character.challenge.target;
    let diffSum = 0;
    let count = 0;
    for (const zoneKey of Object.keys(target)) {
      const actual = result.snapshot[zoneKey]?.length ?? 0;
      diffSum += Math.abs(actual - target[zoneKey]);
      count++;
    }
    const avgDiff = diffSum / count;
    const accuracy = THREE.MathUtils.clamp(1 - avgDiff / 0.25, 0, 1);
    return Math.max(1, Math.round(accuracy * 5));
  }
  const engagement =
    result.stats.toolsUsed.length * 0.6 +
    result.stats.cutsMade * 0.03 +
    result.stats.dyesApplied * 0.5 +
    result.accessories.length * 0.4;
  return Math.max(2, Math.min(5, Math.round(1 + engagement / 3)));
}
