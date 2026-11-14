import { shade } from "./geometry.js";

export function headScale(character) {
  if (character.age === "kid") return 0.86;
  return 1.0;
}

export function frontHeadMarkup(character) {
  const s = headScale(character);
  const skin = character.skinTone;
  const beard = character.facialHair
    ? `<path d="M -48 10 Q -50 55 0 66 Q 50 55 48 10 Q 30 40 0 42 Q -30 40 -48 10 Z" fill="${character.facialHair.color}" opacity="0.95" />`
    : "";
  return `
    <g transform="translate(150,185) scale(${s})">
      <ellipse cx="0" cy="0" rx="70" ry="84" fill="${skin}" />
      <ellipse cx="-68" cy="6" rx="13" ry="20" fill="${skin}" />
      <ellipse cx="68" cy="6" rx="13" ry="20" fill="${skin}" />
      ${beard}
      <g class="eye-group">
        <circle cx="-26" cy="-10" r="7.5" fill="#201810" />
        <circle cx="26" cy="-10" r="7.5" fill="#201810" />
      </g>
      <rect x="-38" y="-32" width="26" height="6" rx="3" fill="${character.hairColor}" transform="rotate(-6 -25 -29)" />
      <rect x="12" y="-32" width="26" height="6" rx="3" fill="${character.hairColor}" transform="rotate(6 25 -29)" />
      <path d="M -6 4 L 6 4 L 0 22 Z" fill="${shade(skin, -12)}" />
      <path d="M -16 40 Q 0 52 16 40" stroke="#8a3b3b" stroke-width="6" fill="none" stroke-linecap="round" />
    </g>
  `;
}

export function profileHeadMarkup(character) {
  const s = headScale(character);
  const skin = character.skinTone;
  const beard = character.facialHair
    ? `<path d="M 0 28 Q 30 36 30 55 Q 20 72 -10 74 Q -30 65 -28 40 Q -16 30 0 28 Z" fill="${character.facialHair.color}" opacity="0.95" />`
    : "";
  return `
    <g transform="translate(150,185) scale(${s})">
      <path d="M -34 -78 Q 50 -80 52 -10 Q 54 10 40 22 L 46 30 L 34 34 Q 40 55 20 72 Q 0 86 -34 80 Q -58 60 -56 10 Q -58 -50 -34 -78 Z" fill="${skin}" />
      <ellipse cx="-50" cy="4" rx="11" ry="17" fill="${skin}" />
      ${beard}
      <circle cx="18" cy="-8" r="6.5" fill="#201810" />
      <rect x="4" y="-26" width="22" height="5.5" rx="2.5" fill="${character.hairColor}" transform="rotate(4 15 -23)" />
      <path d="M 40 22 L 46 30 L 34 34 Z" fill="${shade(skin, -14)}" />
    </g>
  `;
}

export function backHeadMarkup(character) {
  const s = headScale(character);
  const skin = character.skinTone;
  return `
    <g transform="translate(150,185) scale(${s})">
      <ellipse cx="0" cy="0" rx="68" ry="84" fill="${skin}" />
      <ellipse cx="-64" cy="8" rx="11" ry="18" fill="${skin}" />
      <ellipse cx="64" cy="8" rx="11" ry="18" fill="${skin}" />
    </g>
  `;
}
