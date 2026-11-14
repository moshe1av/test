import { frontHeadMarkup, profileHeadMarkup, backHeadMarkup, headScale } from "./HeadShapes.js";
import { hairMarkup } from "./HairShapes.js";
import { shade } from "./geometry.js";

export const ANGLES = ["front", "right", "back", "left"];
export const THUMB_VIEWBOX = "20 70 260 230";
export const FULL_VIEWBOX = "0 0 300 440";

function accessoryFrontMarkup(accessories) {
  let s = "";
  if (accessories.includes("glasses")) {
    s += `<g transform="translate(150,175)">
      <circle cx="-26" cy="0" r="16" fill="none" stroke="#222" stroke-width="4" />
      <circle cx="26" cy="0" r="16" fill="none" stroke="#222" stroke-width="4" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="#222" stroke-width="4" />
    </g>`;
  }
  if (accessories.includes("hat")) {
    s += `<g transform="translate(150,96)">
      <ellipse cx="0" cy="0" rx="74" ry="18" fill="#3a3a6b" />
      <rect x="-50" y="-46" width="100" height="46" rx="10" fill="#3a3a6b" />
    </g>`;
  }
  if (accessories.includes("headband")) {
    s += `<g transform="translate(150,140)">
      <rect x="-72" y="-8" width="144" height="16" rx="8" fill="#e07a9b" />
    </g>`;
  }
  return s;
}

export function buildScene(character, state) {
  const { tier, angle, color, wet, styleHold, curlBoost, thinned, accessories = [] } = state;
  const mirror = angle === "left";
  const baseAngle = angle === "left" ? "right" : angle;

  let headMarkup;
  if (baseAngle === "front") headMarkup = frontHeadMarkup(character);
  else if (baseAngle === "back") headMarkup = backHeadMarkup(character);
  else headMarkup = profileHeadMarkup(character);

  const hairColor = wet ? shade(color, -22) : color;
  const hair = hairMarkup(character, tier, baseAngle, { color: hairColor, styleHold, curlBoost, thinned });
  const scaled = `<g transform="translate(150,185) scale(${headScale(character)})">${hair}</g>`;
  const accessoryMarkup = baseAngle === "front" ? accessoryFrontMarkup(accessories) : "";

  return `<g transform="${mirror ? "scale(-1,1) translate(-300,0)" : ""}">${headMarkup}${scaled}${accessoryMarkup}</g>`;
}

export function svgWrapper(inner, viewBox = FULL_VIEWBOX) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMax meet">${inner}</svg>`;
}

export function renderThumbnail(character) {
  const scene = buildScene(character, {
    tier: character.startTier,
    angle: "front",
    color: character.hairColor,
    wet: false,
    styleHold: false,
    curlBoost: false,
    thinned: false,
    accessories: [],
  });
  return svgWrapper(scene, THUMB_VIEWBOX);
}

export class Portrait {
  constructor(container) {
    this.container = container;
    this.layerA = document.createElement("div");
    this.layerB = document.createElement("div");
    this.layerA.className = "portrait-layer";
    this.layerB.className = "portrait-layer";
    this.layerB.style.opacity = "0";
    container.appendChild(this.layerA);
    container.appendChild(this.layerB);
    this.active = this.layerA;
    this.hidden = this.layerB;
  }

  render(character, state) {
    this.character = character;
    this.state = state;
    this.active.innerHTML = svgWrapper(buildScene(character, state));
  }

  setAngle(character, state) {
    const newLayer = this.hidden;
    const oldLayer = this.active;
    newLayer.innerHTML = svgWrapper(buildScene(character, state));
    newLayer.style.transition = "opacity 260ms ease";
    oldLayer.style.transition = "opacity 260ms ease";
    requestAnimationFrame(() => {
      newLayer.style.opacity = "1";
      oldLayer.style.opacity = "0";
    });
    this.active = newLayer;
    this.hidden = oldLayer;
    this.character = character;
    this.state = state;
  }

  flourish() {
    this.active.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }],
      { duration: 190, easing: "ease-out" }
    );
  }

  blink() {
    const groups = this.active.querySelectorAll(".eye-group");
    for (const g of groups) {
      g.style.transition = "transform 90ms";
      g.style.transformOrigin = "center";
      g.style.transform = "scaleY(0.1)";
      setTimeout(() => (g.style.transform = "scaleY(1)"), 110);
    }
  }

  currentSvgMarkup() {
    return this.active.innerHTML;
  }
}
