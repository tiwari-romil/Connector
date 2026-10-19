// Tiny SVG drawing kit for the LogIQids practice bank.
// Every picture is a plain SVG string, so questions stay pure data and can be unit-tested.

export const INK = "#26233a";
export const GREY = "#b8b8c4";
const FONT = `font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, Nunito, sans-serif"`;

export function svg(w: number, h: number, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
}

const stroke = (sw = 3) => `stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
const fillOf = (f: Fill) => (f === "black" ? INK : f === "grey" ? GREY : f === "white" ? "#fff" : "none");

export type Fill = "none" | "white" | "black" | "grey";
export type ShapeKind = "circle" | "square" | "triangle" | "star" | "hexagon" | "pentagon" | "diamond" | "heart" | "rect" | "cross" | "moon";

function polygon(cx: number, cy: number, r: number, sides: number, rotate = -90) {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((rotate + (360 / sides) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export function shape(kind: ShapeKind, cx: number, cy: number, r: number, fill: Fill = "white", sw = 3): string {
  const f = `fill="${fillOf(fill)}" ${stroke(sw)}`;
  switch (kind) {
    case "circle": return `<circle cx="${cx}" cy="${cy}" r="${r}" ${f}/>`;
    case "square": return `<rect x="${cx - r * 0.85}" y="${cy - r * 0.85}" width="${r * 1.7}" height="${r * 1.7}" ${f}/>`;
    case "rect": return `<rect x="${cx - r}" y="${cy - r * 0.55}" width="${r * 2}" height="${r * 1.1}" ${f}/>`;
    case "triangle": return `<polygon points="${polygon(cx, cy + r * 0.15, r * 1.05, 3)}" ${f}/>`;
    case "hexagon": return `<polygon points="${polygon(cx, cy, r, 6, 0)}" ${f}/>`;
    case "pentagon": return `<polygon points="${polygon(cx, cy, r, 5)}" ${f}/>`;
    case "diamond": return `<polygon points="${polygon(cx, cy, r, 4)}" ${f}/>`;
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const rr = i % 2 ? r * 0.45 : r;
        const a = ((-90 + 36 * i) * Math.PI) / 180;
        return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${pts}" ${f}/>`;
    }
    case "heart": {
      const s = r / 20;
      return `<path transform="translate(${cx - 20 * s} ${cy - 20 * s}) scale(${s})" d="M20 36 C6 26 1 17 5 10 C9 3 17 4 20 11 C23 4 31 3 35 10 C39 17 34 26 20 36 Z" fill="${fillOf(fill)}" ${stroke(sw / s)}/>`;
    }
    case "cross": {
      const a = r * 0.36;
      const pts = [[-a, -r], [a, -r], [a, -a], [r, -a], [r, a], [a, a], [a, r], [-a, r], [-a, a], [-r, a], [-r, -a], [-a, -a]].map(([x, y]) => `${cx + x},${cy + y}`).join(" ");
      return `<polygon points="${pts}" ${f}/>`;
    }
    case "moon": return `<path d="M${cx + r * 0.3} ${cy - r} A${r} ${r} 0 1 0 ${cx + r * 0.3} ${cy + r} A${r * 0.75} ${r * 0.75} 0 1 1 ${cx + r * 0.3} ${cy - r} Z" ${f}/>`;
  }
}

export function text(x: number, y: number, value: string, size = 26, extra = "") {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="${INK}" ${FONT} ${extra}>${value}</text>`;
}

export function line(x1: number, y1: number, x2: number, y2: number, sw = 3, dash = false) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke(sw)}${dash ? ` stroke-dasharray="5 6"` : ""}/>`;
}

export function arrow(x1: number, y: number, x2: number) {
  return `${line(x1, y, x2 - 4, y, 2.5)}<polygon points="${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}" fill="${INK}"/>`;
}

export function rect(x: number, y: number, w: number, h: number, fill: Fill = "white", sw = 3) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillOf(fill)}" ${stroke(sw)}/>`;
}

export function poly(points: number[][], fill: Fill = "white", closed = true, sw = 3) {
  const pts = points.map(([x, y]) => `${x},${y}`).join(" ");
  return closed ? `<polygon points="${pts}" fill="${fillOf(fill)}" ${stroke(sw)}/>` : `<polyline points="${pts}" fill="none" ${stroke(sw)}/>`;
}

/** An emoji drawn as a solid black silhouette (for shadow questions). */
export function silhouette(x: number, y: number, glyph: string, size: number, transform = "") {
  return `<g transform="${transform}"><text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central" ${FONT} style="filter:brightness(0)">${glyph}</text></g>`;
}
