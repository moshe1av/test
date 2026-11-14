import * as THREE from "three";
import { SceneManager } from "../engine/SceneManager.js";
import { buildBarbershop } from "../engine/BarbershopScene.js";
import { buildHead } from "../engine/HeadBuilder.js";
import { HairSystem } from "../engine/HairSystem.js";
import { FallingHairSystem } from "../engine/FallingHair.js";
import { createToolDock } from "../ui/ToolDock.js";
import { createRotationSlider } from "../ui/RotationControl.js";
import { Tools } from "../data/tools.js";
import { HairDyeColors } from "../data/hairColors.js";
import { gameState, Screens, Modes } from "../state/GameState.js";
import { AudioEngine } from "../audio/AudioEngine.js";

const SNIP_INTERVAL = 90;
const CLIPPER_RATE = 0.55;
const RAZOR_RATE = 0.9;
const STYLE_RATE = 0.6;
const GROW_AMOUNT = 0.12;
const DYE_DRAG_THROTTLE = 80;
const ACCESSORY_TOOLS = ["glasses", "hat", "headband"];

export function renderGameplay(root, goTo) {
  root.innerHTML = "";
  const character = gameState.character;

  const el = document.createElement("div");
  el.className = "screen gameplay-screen";
  el.innerHTML = `
    <div class="hud-top">
      <button class="hud-btn back-btn">←</button>
      <div class="hud-title">
        <div class="hud-name">${character.name}</div>
        <div class="hud-mode">${gameState.mode === Modes.CHALLENGE ? character.challenge.label : "Freestyle Mode"}</div>
      </div>
      <button class="hud-btn mute-btn">🔊</button>
    </div>
    <div class="rotation-overlay"></div>
    <div class="action-bar">
      <button class="hud-btn broom-btn" title="Sweep floor">🧹</button>
      <button class="btn-primary finish-btn">Finish</button>
    </div>
    <div class="canvas-host"></div>
    <div class="subpanel" style="display:none;"></div>
    <div class="dock-host"></div>
  `;
  root.appendChild(el);

  const canvasHost = el.querySelector(".canvas-host");
  const subpanel = el.querySelector(".subpanel");
  const dockHost = el.querySelector(".dock-host");
  const rotationOverlay = el.querySelector(".rotation-overlay");

  const sceneManager = new SceneManager(canvasHost);
  sceneManager.scene.add(buildBarbershop());

  const rotationGroup = new THREE.Group();
  rotationGroup.position.set(0, 1.42, 0);
  sceneManager.scene.add(rotationGroup);

  const headRig = buildHead(character);
  rotationGroup.add(headRig);

  const hairSystem = new HairSystem(character);
  rotationGroup.add(hairSystem.group);

  const accessories = buildAccessories(headRig);

  const fallingHair = new FallingHairSystem(0);
  sceneManager.scene.add(fallingHair.group);

  let currentTool = "scissors";
  let guardIndex = 2;
  let dyeColor = HairDyeColors[0];
  let pointerActive = false;
  const activePointers = new Map();
  let lastSnip = 0;
  let lastDyeTick = 0;
  let pinchStartDist = 0;
  let pinchStartZ = sceneManager.camera.position.z;
  let lastFrameTime = performance.now();

  const dock = createToolDock((toolId) => selectTool(toolId));
  dockHost.appendChild(dock.element);
  dock.setActive(currentTool);

  const rotationSlider = createRotationSlider((deg) => {
    rotationGroup.rotation.y = THREE.MathUtils.degToRad(deg);
  });
  rotationOverlay.appendChild(rotationSlider.element);

  function selectTool(toolId) {
    stopContinuousSounds();
    currentTool = toolId;
    dock.setActive(toolId);
    AudioEngine.uiTap();
    gameState.stats.toolsUsed.add(toolId);
    renderSubpanel();
  }

  function renderSubpanel() {
    subpanel.innerHTML = "";
    if (currentTool === "clippers") {
      subpanel.style.display = "flex";
      const guards = Tools.find((t) => t.id === "clippers").guards;
      guards.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.className = "guard-btn" + (i === guardIndex ? " active" : "");
        btn.textContent = `#${i}`;
        btn.addEventListener("click", () => {
          guardIndex = i;
          renderSubpanel();
          AudioEngine.uiTap();
        });
        subpanel.appendChild(btn);
      });
    } else if (currentTool === "dye") {
      subpanel.style.display = "flex";
      HairDyeColors.forEach((color) => {
        const btn = document.createElement("button");
        btn.className = "swatch-btn" + (color === dyeColor ? " active" : "");
        btn.style.background = color;
        btn.addEventListener("click", () => {
          dyeColor = color;
          renderSubpanel();
          AudioEngine.uiTap();
        });
        subpanel.appendChild(btn);
      });
      const allBtn = document.createElement("button");
      allBtn.className = "guard-btn";
      allBtn.textContent = "All";
      allBtn.addEventListener("click", () => {
        hairSystem.setZoneColor("all", dyeColor);
        AudioEngine.aerosolSpray.start();
        setTimeout(() => AudioEngine.aerosolSpray.stop(), 350);
        gameState.stats.dyesApplied++;
      });
      subpanel.appendChild(allBtn);
    } else {
      subpanel.style.display = "none";
    }
  }
  renderSubpanel();

  function buildAccessories(headGroup) {
    const radius = headGroup.userData.headRadius;
    const map = {};

    const glasses = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (const side of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 16), frameMat);
      ring.position.set(side * 0.13, 0, radius * 0.95);
      glasses.add(ring);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.012), frameMat);
    bridge.position.set(0, 0, radius * 0.95);
    glasses.add(bridge);
    glasses.position.y = radius * 0.08;
    glasses.visible = false;
    headGroup.add(glasses);
    map.glasses = glasses;

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius * 0.78, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x3a3a6b })
    );
    hat.position.y = radius * 0.95;
    hat.visible = false;
    headGroup.add(hat);
    map.hat = hat;

    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.92, 0.025, 8, 24, Math.PI * 1.1),
      new THREE.MeshStandardMaterial({ color: 0xe07a9b })
    );
    headband.position.y = radius * 0.5;
    headband.rotation.x = Math.PI / 2;
    headband.rotation.z = Math.PI * 0.5;
    headband.visible = false;
    headGroup.add(headband);
    map.headband = headband;

    return map;
  }

  function toggleAccessory(id) {
    const mesh = accessories[id];
    if (!mesh) return;
    mesh.visible = !mesh.visible;
    if (mesh.visible) gameState.stats.accessoriesWorn++;
    AudioEngine.uiTap();
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function intersectScalp(e) {
    const rect = sceneManager.renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, sceneManager.camera);
    const hits = raycaster.intersectObject(hairSystem.proxy, false);
    if (!hits.length) return null;
    const local = hairSystem.group.worldToLocal(hits[0].point.clone());
    return { zoneKey: hairSystem.classifyPoint(local), point: hits[0].point };
  }

  function applyTool(zoneKey, worldPoint, dt) {
    switch (currentTool) {
      case "clippers": {
        const guard = Tools.find((t) => t.id === "clippers").guards[guardIndex];
        const zone = hairSystem.zones[zoneKey];
        if (zone.length > guard) {
          const amount = Math.min(zone.length - guard, CLIPPER_RATE * dt);
          const { delta, color } = hairSystem.cutZone(zoneKey, amount);
          if (delta > 0) {
            fallingHair.spawn(worldPoint, color, delta);
            gameState.stats.cutsMade++;
          }
          AudioEngine.clippers.setIntensity(1);
        } else {
          AudioEngine.clippers.setIntensity(0.15);
        }
        break;
      }
      case "scissors":
      case "thinning": {
        const now = performance.now();
        if (now - lastSnip > SNIP_INTERVAL) {
          lastSnip = now;
          const amount = currentTool === "scissors" ? 0.05 : 0.025;
          const { delta, color } = hairSystem.cutZone(zoneKey, amount);
          if (delta > 0) {
            fallingHair.spawn(worldPoint, color, delta);
            gameState.stats.cutsMade++;
            AudioEngine.scissorsSnip();
          }
        }
        break;
      }
      case "razor": {
        const { delta, color } = hairSystem.cutZone(zoneKey, RAZOR_RATE * dt);
        if (delta > 0) {
          fallingHair.spawn(worldPoint, color, delta);
          gameState.stats.cutsMade++;
        }
        break;
      }
      case "comb":
      case "brush": {
        const now = performance.now();
        if (now - lastSnip > 160) {
          lastSnip = now;
          AudioEngine.combStroke();
        }
        break;
      }
      case "dryer": {
        hairSystem.setZoneWet(zoneKey, false);
        hairSystem.applyForce(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4));
        break;
      }
      case "straightener": {
        const zone = hairSystem.zones[zoneKey];
        hairSystem.setZoneCurl(zoneKey, zone.curl - STYLE_RATE * dt);
        break;
      }
      case "curler": {
        const zone = hairSystem.zones[zoneKey];
        hairSystem.setZoneCurl(zoneKey, zone.curl + STYLE_RATE * dt);
        break;
      }
      case "water": {
        const now = performance.now();
        if (now - lastSnip > 180) {
          lastSnip = now;
          hairSystem.setZoneWet(zoneKey, true);
          AudioEngine.waterSpray();
        }
        break;
      }
      case "potion": {
        const now = performance.now();
        if (now - lastSnip > 300) {
          lastSnip = now;
          hairSystem.growZone(zoneKey, GROW_AMOUNT);
          AudioEngine.magicChime();
        }
        break;
      }
      case "dye": {
        const now = performance.now();
        if (now - lastDyeTick > DYE_DRAG_THROTTLE) {
          lastDyeTick = now;
          hairSystem.setZoneColor(zoneKey, dyeColor);
        }
        break;
      }
      case "gel":
      case "hairspray": {
        hairSystem.setStyleHold(1);
        break;
      }
      default:
        break;
    }
  }

  function startContinuousSounds() {
    if (currentTool === "clippers") AudioEngine.clippers.start();
    if (currentTool === "razor") AudioEngine.razorScrape.start();
    if (currentTool === "dryer") AudioEngine.dryerAirflow.start();
    if (currentTool === "dye") AudioEngine.aerosolSpray.start();
    if (currentTool === "gel" || currentTool === "hairspray") AudioEngine.stylingSizzle();
  }

  function stopContinuousSounds() {
    AudioEngine.clippers.stop();
    AudioEngine.razorScrape.stop();
    AudioEngine.dryerAirflow.stop();
    AudioEngine.aerosolSpray.stop();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 1) {
      pointerActive = true;
      startContinuousSounds();
      const hit = intersectScalp(e);
      if (hit) {
        if (ACCESSORY_TOOLS.includes(currentTool)) {
          toggleAccessory(currentTool);
        } else {
          applyTool(hit.zoneKey, hit.point, 0.016);
        }
      }
    } else if (activePointers.size === 2) {
      pointerActive = false;
      stopContinuousSounds();
      const pts = Array.from(activePointers.values());
      pinchStartDist = distance(pts[0], pts[1]);
      pinchStartZ = sceneManager.camera.position.z;
    }
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    const prev = activePointers.get(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      const dist = distance(pts[0], pts[1]);
      const deltaX = e.clientX - prev.x;
      rotationGroup.rotation.y += deltaX * 0.006;
      rotationSlider.setValue(THREE.MathUtils.radToDeg(rotationGroup.rotation.y));
      if (pinchStartDist > 10) {
        const scale = dist / pinchStartDist;
        sceneManager.camera.position.z = THREE.MathUtils.clamp(pinchStartZ / scale, 2.1, 4.4);
      }
      return;
    }

    if (pointerActive && !ACCESSORY_TOOLS.includes(currentTool)) {
      const now = performance.now();
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      const hit = intersectScalp(e);
      if (hit) applyTool(hit.zoneKey, hit.point, dt);
    }
  }

  function onPointerUp(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) {
      pointerActive = false;
      stopContinuousSounds();
    }
  }

  const dom = sceneManager.renderer.domElement;
  dom.style.touchAction = "none";
  dom.addEventListener("pointerdown", onPointerDown);
  dom.addEventListener("pointermove", onPointerMove);
  dom.addEventListener("pointerup", onPointerUp);
  dom.addEventListener("pointercancel", onPointerUp);
  dom.addEventListener("pointerleave", onPointerUp);

  let blinkTimer = randBlink();
  function randBlink() {
    return 2 + Math.random() * 3;
  }

  sceneManager.addUpdate((dt) => {
    hairSystem.update(dt);
    fallingHair.update(dt);
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blinkTimer = randBlink();
      for (const eye of headRig.userData.eyes) eye.scale.y = 0.1;
      setTimeout(() => {
        for (const eye of headRig.userData.eyes) eye.scale.y = 1;
      }, 110);
    }
    lastFrameTime = performance.now();
  });
  sceneManager.start();

  el.querySelector(".broom-btn").addEventListener("click", () => {
    fallingHair.sweep();
    AudioEngine.combStroke();
    AudioEngine.uiTap();
  });

  el.querySelector(".back-btn").addEventListener("click", () => {
    sceneManager.dispose();
    goTo(Screens.CHARACTER_SELECT);
  });

  let muted = false;
  el.querySelector(".mute-btn").addEventListener("click", (e) => {
    muted = !muted;
    AudioEngine.setMuted(muted);
    e.target.textContent = muted ? "🔇" : "🔊";
  });

  el.querySelector(".finish-btn").addEventListener("click", () => {
    gameState.result = {
      snapshot: hairSystem.getSnapshot(),
      accessories: Object.keys(accessories).filter((k) => accessories[k].visible),
      stats: { ...gameState.stats, toolsUsed: Array.from(gameState.stats.toolsUsed) },
    };
    AudioEngine.finishFanfare();
    sceneManager.dispose();
    goTo(Screens.SHOWCASE);
  });
}
