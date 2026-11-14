export class FallingHair2D {
  constructor(container, floorEl) {
    this.container = container;
    this.floorEl = floorEl;
    this.pileWidth = 0;
  }

  spawnBurst(color, count = 6) {
    for (let i = 0; i < count; i++) {
      const clump = document.createElement("div");
      clump.className = "hair-clump";
      clump.style.background = color;
      const startX = 42 + Math.random() * 16;
      clump.style.left = `${startX}%`;
      clump.style.top = `18%`;
      const rot = (Math.random() - 0.5) * 60;
      this.container.appendChild(clump);
      const fallDistance = 230 + Math.random() * 60;
      const anim = clump.animate(
        [
          { transform: `translateY(0px) rotate(${rot}deg)`, opacity: 1 },
          { transform: `translateY(${fallDistance}px) rotate(${rot + (Math.random() - 0.5) * 300}deg)`, opacity: 1 },
        ],
        { duration: 600 + Math.random() * 280, easing: "cubic-bezier(.4,0,.8,1)" }
      );
      anim.onfinish = () => {
        clump.remove();
        this.growPile(color);
      };
    }
  }

  growPile(color) {
    this.pileWidth = Math.min(this.pileWidth + 3, 170);
    if (this.pileWidth <= 0) {
      this.floorEl.style.opacity = "0";
      return;
    }
    this.floorEl.style.width = `${this.pileWidth}px`;
    this.floorEl.style.height = `${Math.min(8 + this.pileWidth * 0.26, 56)}px`;
    this.floorEl.style.background = color;
    this.floorEl.style.opacity = "1";
  }

  sweep() {
    this.pileWidth = 0;
    this.floorEl.style.width = "0px";
    this.floorEl.style.height = "0px";
    this.floorEl.style.opacity = "0";
  }
}
