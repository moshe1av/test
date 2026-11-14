import { mulberry32, seedFromString, smoothClosedPath } from "./geometry.js";
import { TierHang } from "../data/tiers.js";

function jitterFor(hairType) {
  switch (hairType) {
    case "wavy":
      return { amp: 9 };
    case "curly":
      return { amp: 16 };
    case "thin":
      return { amp: 2 };
    default:
      return { amp: 3 };
  }
}

function ring(cx, cy, rx, ry, count, rng, amp) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 1 + (rng() - 0.5) * (amp / 60);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return pts;
}

export function hairMarkup(character, tier, angle, opts = {}) {
  const color = opts.color || character.hairColor;
  const opacity = opts.thinned ? 0.82 : 1;
  const ampScale = opts.styleHold ? 0.35 : opts.curlBoost ? 1.5 : 1;
  const rng = mulberry32(seedFromString(character.id + angle));
  const hang = TierHang[tier] * (character.hairType === "thin" ? 0.45 : 1);

  if (character.hairType === "afro") {
    const rx = (angle === "right" || angle === "left" ? 66 : 76) + tier * 13;
    const ry = 80 + tier * 11;
    const cx = angle === "front" || angle === "back" ? 0 : -4;
    const outer = ring(cx, -6, rx, ry, 16, rng, 16 * ampScale);
    if (angle === "back") {
      return `<path d="${smoothClosedPath(outer)}" fill="${color}" opacity="${opacity}" />`;
    }
    // front/profile: punch a face-shaped hole so the face stays visible
    const holeCx = angle === "front" ? 0 : 14;
    const inner = ring(holeCx, -4, 52, 68, 14, rng, 5);
    const d = `${smoothClosedPath(outer)} ${smoothClosedPath(inner)}`;
    return `<path d="${d}" fill="${color}" opacity="${opacity}" fill-rule="evenodd" />`;
  }

  if (character.hairType === "spiky") {
    const spikeOut = (24 + tier * 15) * (opts.styleHold ? 0.6 : 1);
    const n = 9;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = -56 + t * 112;
      const topY = i % 2 === 0 ? -64 - spikeOut : -74;
      d += (i === 0 ? "M" : "L") + ` ${x.toFixed(1)} ${topY.toFixed(1)} `;
    }
    const bottomY = -20 + hang * 0.35;
    d += `L 60 -20 L 50 ${bottomY.toFixed(1)} L -50 ${bottomY.toFixed(1)} L -60 -20 Z`;
    return `<path d="${d}" fill="${color}" opacity="${opacity}" />`;
  }

  const { amp } = jitterFor(character.hairType);
  const j = () => (rng() - 0.5) * amp * ampScale;
  const bottomY = -56 + hang;

  if (angle === "back") {
    const pts = ring(0, -10, 78, 90 + hang * 0.55, 18, rng, amp * ampScale);
    return `<path d="${smoothClosedPath(pts)}" fill="${color}" opacity="${opacity}" />`;
  }

  if (angle === "front") {
    const sideBottom = Math.max(bottomY, -40);
    const centerDip = -48;
    const pts = [
      [-34 + j(), -58 + j()],
      [-52 + j(), -72 + j()],
      [-20 + j(), -84 + j()],
      [0 + j(), -86 + j()],
      [20 + j(), -84 + j()],
      [52 + j(), -72 + j()],
      [34 + j(), -58 + j()],
      [74 + j(), -40 + j()],
      [70 + j(), sideBottom + j()],
      [0, centerDip + j()],
      [-70 + j(), sideBottom + j()],
      [-74 + j(), -40 + j()],
    ];
    return `<path d="${smoothClosedPath(pts)}" fill="${color}" opacity="${opacity}" />`;
  }

  // profile (base for "right"; "left" is mirrored by the caller)
  const pts = [
    [-10 + j(), -78 + j()],
    [20 + j(), -82 + j()],
    [48 + j(), -62 + j()],
    [54 + j(), -30 + j()],
    [40 + j(), -10 + j()],
    [54 + j(), bottomY * 0.4 + j()],
    [30 + j(), bottomY + j()],
    [-20 + j(), bottomY + 6 + j()],
    [-50 + j(), bottomY * 0.5 + j()],
    [-56 + j(), -40 + j()],
  ];
  return `<path d="${smoothClosedPath(pts)}" fill="${color}" opacity="${opacity}" />`;
}
