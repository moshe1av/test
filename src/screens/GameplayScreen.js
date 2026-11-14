import { Portrait, ANGLES } from "../render/Portrait.js";
import { FallingHair2D } from "../render/FallingHair2D.js";
import { createToolDock } from "../ui/ToolDock.js";
import { createRotationSlider } from "../ui/RotationControl.js";
import { Tools } from "../data/tools.js";
import { TierNames } from "../data/tiers.js";
import { HairDyeColors } from "../data/hairColors.js";
import { gameState, Screens, Modes } from "../state/GameState.js";
import { AudioEngine } from "../audio/AudioEngine.js";

const ACCESSORY_TOOLS = ["glasses", "hat", "headband"];
const TAP_MOVE_THRESHOLD = 12;
const SWIPE_THRESHOLD = 46;

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
    <div class="portrait-stage">
      <div class="shop-backdrop"></div>
      <div class="portrait-mount"></div>
      <div class="floor-pile"></div>
    </div>
    <div class="subpanel" style="display:none;"></div>
    <div class="dock-host"></div>
  `;
  root.appendChild(el);

  const stage = el.querySelector(".portrait-stage");
  const mount = el.querySelector(".portrait-mount");
  const floorPile = el.querySelector(".floor-pile");
  const subpanel = el.querySelector(".subpanel");
  const dockHost = el.querySelector(".dock-host");
  const rotationOverlay = el.querySelector(".rotation-overlay");

  const portrait = new Portrait(mount);
  const fallingHair = new FallingHair2D(stage, floorPile);

  let state = {
    tier: character.startTier,
    angle: ANGLES[0],
    color: character.hairColor,
    wet: false,
    styleHold: false,
    curlBoost: false,
    thinned: false,
    accessories: [],
  };
  let angleIndex = 0;
  let currentTool = "scissors";
  let guardTier = 0;
  let dyeColor = HairDyeColors[0];

  portrait.render(character, state);

  const dock = createToolDock((toolId) => selectTool(toolId));
  dockHost.appendChild(dock.element);
  dock.setActive(currentTool);

  const rotationSlider = createRotationSlider((idx) => setAngle(idx));
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
      TierNames.forEach((label, i) => {
        const btn = document.createElement("button");
        btn.className = "guard-btn" + (i === guardTier ? " active" : "");
        btn.textContent = `#${i} ${label}`;
        btn.addEventListener("click", () => {
          guardTier = i;
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
    } else {
      subpanel.style.display = "none";
    }
  }
  renderSubpanel();

  function setAngle(idx) {
    angleIndex = ((idx % ANGLES.length) + ANGLES.length) % ANGLES.length;
    state = { ...state, angle: ANGLES[angleIndex] };
    portrait.setAngle(character, state);
    rotationSlider.setIndex(angleIndex);
  }

  function applyState(flourish = true) {
    portrait.render(character, state);
    if (flourish) portrait.flourish();
  }

  function startContinuousSounds() {
    if (currentTool === "clippers") AudioEngine.clippers.start();
    if (currentTool === "razor") AudioEngine.razorScrape.start();
    if (currentTool === "dryer") AudioEngine.dryerAirflow.start();
    if (currentTool === "dye") AudioEngine.aerosolSpray.start();
  }

  function stopContinuousSounds() {
    AudioEngine.clippers.stop();
    AudioEngine.razorScrape.stop();
    AudioEngine.dryerAirflow.stop();
    AudioEngine.aerosolSpray.stop();
  }

  function cutTo(newTier) {
    if (newTier >= state.tier) return;
    gameState.stats.cutsMade++;
    fallingHair.spawnBurst(state.color, 5 + (state.tier - newTier) * 2);
    state = { ...state, tier: newTier };
    applyState();
  }

  function performTool() {
    switch (currentTool) {
      case "clippers": {
        const target = Math.max(guardTier, 0);
        if (state.tier > target) {
          cutTo(Math.max(target, state.tier - 1));
          AudioEngine.clippers.setIntensity(1);
        }
        break;
      }
      case "scissors": {
        if (state.tier > 0) {
          cutTo(state.tier - 1);
          AudioEngine.scissorsSnip();
        }
        break;
      }
      case "thinning": {
        state = { ...state, thinned: true };
        applyState();
        AudioEngine.combStroke();
        break;
      }
      case "razor": {
        if (state.tier > 0) cutTo(0);
        break;
      }
      case "comb":
      case "brush": {
        state = { ...state, styleHold: false, curlBoost: false, thinned: false };
        applyState();
        AudioEngine.combStroke();
        break;
      }
      case "water": {
        state = { ...state, wet: true };
        applyState();
        AudioEngine.waterSpray();
        break;
      }
      case "dryer": {
        state = { ...state, wet: false };
        applyState();
        break;
      }
      case "straightener": {
        state = { ...state, styleHold: true, curlBoost: false };
        applyState();
        AudioEngine.stylingSizzle();
        break;
      }
      case "curler": {
        state = { ...state, curlBoost: true, styleHold: false };
        applyState();
        AudioEngine.stylingSizzle();
        break;
      }
      case "potion": {
        if (state.tier < character.maxTier) {
          state = { ...state, tier: state.tier + 1 };
          applyState();
        }
        AudioEngine.magicChime();
        break;
      }
      case "dye": {
        state = { ...state, color: dyeColor };
        applyState();
        gameState.stats.dyesApplied++;
        break;
      }
      case "gel":
      case "hairspray": {
        state = { ...state, styleHold: true };
        applyState();
        AudioEngine.stylingSizzle();
        break;
      }
      default:
        break;
    }
  }

  function toggleAccessory(id) {
    const has = state.accessories.includes(id);
    const accessories = has ? state.accessories.filter((a) => a !== id) : [...state.accessories, id];
    state = { ...state, accessories };
    applyState(false);
    if (!has) gameState.stats.accessoriesWorn++;
    AudioEngine.uiTap();
  }

  // --- gesture handling ---
  const activePointers = new Map();
  let singleStart = null;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let twoStartX = 0;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 1) {
      singleStart = { x: e.clientX, y: e.clientY };
      startContinuousSounds();
    } else if (activePointers.size === 2) {
      stopContinuousSounds();
      const pts = Array.from(activePointers.values());
      pinchStartDist = dist(pts[0], pts[1]);
      pinchStartScale = stage.dataset.scale ? parseFloat(stage.dataset.scale) : 1;
      twoStartX = (pts[0].x + pts[1].x) / 2;
    }
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      const d = dist(pts[0], pts[1]);
      if (pinchStartDist > 10) {
        const scale = Math.min(1.3, Math.max(0.85, pinchStartScale * (d / pinchStartDist)));
        stage.style.setProperty("--stage-scale", scale);
        stage.dataset.scale = String(scale);
      }
    }
  }

  function onPointerUp(e) {
    const wasTwo = activePointers.size === 2;
    const ptrs = Array.from(activePointers.values());
    activePointers.delete(e.pointerId);

    if (wasTwo) {
      const midX = ptrs.length === 2 ? (ptrs[0].x + ptrs[1].x) / 2 : e.clientX;
      const swipe = midX - twoStartX;
      if (Math.abs(swipe) > SWIPE_THRESHOLD) {
        setAngle(angleIndex + (swipe < 0 ? 1 : -1));
        AudioEngine.uiTap();
      }
    } else if (activePointers.size === 0 && singleStart) {
      const moved = Math.hypot(e.clientX - singleStart.x, e.clientY - singleStart.y);
      if (moved < TAP_MOVE_THRESHOLD) {
        if (ACCESSORY_TOOLS.includes(currentTool)) toggleAccessory(currentTool);
        else performTool();
      }
    }
    singleStart = null;
    if (activePointers.size === 0) stopContinuousSounds();
  }

  stage.style.touchAction = "none";
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("pointerleave", onPointerUp);

  let blinkTimer = setInterval(() => portrait.blink(), 3200 + Math.random() * 1500);

  el.querySelector(".broom-btn").addEventListener("click", () => {
    fallingHair.sweep();
    AudioEngine.combStroke();
    AudioEngine.uiTap();
  });

  el.querySelector(".back-btn").addEventListener("click", () => {
    clearInterval(blinkTimer);
    goTo(Screens.CHARACTER_SELECT);
  });

  let muted = false;
  el.querySelector(".mute-btn").addEventListener("click", (e) => {
    muted = !muted;
    AudioEngine.setMuted(muted);
    e.target.textContent = muted ? "🔇" : "🔊";
  });

  el.querySelector(".finish-btn").addEventListener("click", () => {
    clearInterval(blinkTimer);
    gameState.result = {
      finalTier: state.tier,
      finalColor: state.color,
      accessories: state.accessories,
      stats: { ...gameState.stats, toolsUsed: Array.from(gameState.stats.toolsUsed) },
    };
    AudioEngine.finishFanfare();
    goTo(Screens.SHOWCASE);
  });
}
