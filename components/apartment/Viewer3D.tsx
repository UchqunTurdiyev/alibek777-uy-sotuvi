"use client";

// Xonadonning 3D ko'rinishi (three.js). Faqat bo'lim ekranga yaqinlashganda yuklanadi.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Apartment, Item, Opening, Rect, RoomKind } from "@/lib/apartments";

const H = 2.7; // shift balandligi
const CUT = 1.15; // "kesim" rejimida devor balandligi
const CELL = 0.05; // devor rastri qadami (m)
const WALL_REACH = 0.16; // xonadan shu masofagacha bo'lgan bo'shliq devor bo'ladi

export type ViewMode = "3d" | "top";

export type ViewerProps = { apt: Apartment; cutaway: boolean; labels: boolean; mode: ViewMode; onReady?: () => void };

/* ─────────── materiallar ─────────── */

const matCache = new Map<string, THREE.Material>();
function mat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...opts });
    matCache.set(key, m);
  }
  return m;
}

function canvasTex(draw: (c: CanvasRenderingContext2D, s: number) => void, size = 512) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  draw(cv.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let woodTex: THREE.Texture | null = null;
let tileTex: THREE.Texture | null = null;
let deckTex: THREE.Texture | null = null;

function floorTextures() {
  if (!woodTex) {
    // Laminat: 2 m × 2 m kvadratda 10 ta taxta
    woodTex = canvasTex((c, s) => {
      const rows = 10;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        let x = -((r * 137) % s);
        while (x < s) {
          const len = s * (0.45 + ((r * 7 + x) % 5) * 0.07);
          const l = 62 + ((r * 13 + Math.abs(Math.round(x))) % 9);
          c.fillStyle = `hsl(32, 38%, ${l}%)`;
          c.fillRect(x, r * h, len, h);
          c.strokeStyle = "rgba(90,60,30,.25)";
          c.lineWidth = 2;
          c.strokeRect(x, r * h, len, h);
          // tola chiziqlari
          c.strokeStyle = "rgba(120,80,40,.08)";
          for (let k = 0; k < 4; k++) {
            c.beginPath();
            c.moveTo(x, r * h + (k + 1) * (h / 5));
            c.lineTo(x + len, r * h + (k + 1) * (h / 5) + 2);
            c.stroke();
          }
          x += len;
        }
      }
    });
    // Kafel: 2 m da 5 ta (40 sm)
    tileTex = canvasTex((c, s) => {
      c.fillStyle = "#e9e6e1";
      c.fillRect(0, 0, s, s);
      const n = 5;
      const step = s / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          c.fillStyle = (i + j) % 2 ? "#e4e0da" : "#ece9e4";
          c.fillRect(i * step + 2, j * step + 2, step - 4, step - 4);
        }
    });
    // Balkon: yog'och pol
    deckTex = canvasTex((c, s) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        c.fillStyle = i % 2 ? "#a7825c" : "#b08b63";
        c.fillRect(0, (i * s) / n, s, s / n - 3);
      }
    });
  }
  return { wood: woodTex!, tile: tileTex!, deck: deckTex! };
}

/* ─────────── yordamchi: quti qo'shish ─────────── */

function box(g: THREE.Object3D, w: number, h: number, d: number, color: string | THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === "string" ? mat(color) : color);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function cyl(g: THREE.Object3D, rTop: number, rBot: number, h: number, color: string | THREE.Material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), typeof color === "string" ? mat(color) : color);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function sphere(g: THREE.Object3D, r: number, color: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}

/* ─────────── mebellar (mahalliy koordinata: markaz 0,0; orqasi −z da) ─────────── */

const C = {
  wood: "#8a6a4a",
  woodLight: "#c9a77c",
  white: "#f3f1ec",
  fabric: "#8d969e",
  fabricWarm: "#b9a48b",
  dark: "#2b2c30",
  steel: "#c5c9cd",
  green: "#5f8f5a",
  linen: "#f6f3ec",
};

function chair(color = C.wood) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(g, 0.04, 0.45, 0.04, C.dark, x, 0, z);
  box(g, 0.44, 0.05, 0.44, color, 0, 0.45, 0);
  box(g, 0.44, 0.42, 0.04, color, 0, 0.5, -0.2);
  return g;
}

const builders: Record<Item["t"], (it: Item) => THREE.Group> = {
  bed2: (it) => {
    const g = new THREE.Group();
    const w = it.w || 1.8, d = it.d || 2.1;
    box(g, w, 0.32, d, C.woodLight, 0, 0, 0);
    box(g, w - 0.06, 0.2, d - 0.1, C.linen, 0, 0.32, 0.03);
    box(g, w + 0.1, 1.05, 0.1, it.color || "#7d8790", 0, 0, -d / 2 + 0.03);
    box(g, w - 0.04, 0.06, d * 0.58, "#c7b39a", 0, 0.52, d * 0.2);
    box(g, 0.6, 0.12, 0.38, C.white, -w / 4, 0.52, -d / 2 + 0.33);
    box(g, 0.6, 0.12, 0.38, C.white, w / 4, 0.52, -d / 2 + 0.33);
    return g;
  },
  bed1: (it) => {
    const g = new THREE.Group();
    const w = it.w || 0.9, d = it.d || 2.0;
    box(g, w, 0.3, d, C.woodLight, 0, 0, 0);
    box(g, w - 0.05, 0.18, d - 0.08, C.linen, 0, 0.3, 0.02);
    box(g, w + 0.04, 0.85, 0.08, C.woodLight, 0, 0, -d / 2 + 0.02);
    box(g, w - 0.04, 0.05, d * 0.6, it.color || "#c9a0a0", 0, 0.48, d * 0.18);
    box(g, 0.55, 0.11, 0.34, C.white, 0, 0.48, -d / 2 + 0.28);
    return g;
  },
  nightstand: () => {
    const g = new THREE.Group();
    box(g, 0.45, 0.5, 0.4, C.wood);
    cyl(g, 0.05, 0.07, 0.25, C.dark, 0, 0.5, 0);
    cyl(g, 0.1, 0.14, 0.16, mat("#fff4dc", { emissive: "#ffd89a", emissiveIntensity: 0.6 }), 0, 0.72, 0);
    return g;
  },
  wardrobe: (it) => {
    const g = new THREE.Group();
    const w = it.w || 1.2, d = it.d || 0.6, h = 2.2;
    box(g, w, h, d, "#ddd6cb");
    const n = Math.max(2, Math.round(w / 0.5));
    for (let i = 1; i < n; i++) box(g, 0.01, h - 0.1, 0.01, "#a69d90", -w / 2 + (i * w) / n, 0.05, d / 2 + 0.005);
    for (let i = 0; i < n; i++) box(g, 0.02, 0.3, 0.03, C.dark, -w / 2 + ((i + 0.5) * w) / n + (i % 2 ? -0.08 : 0.08), 1.0, d / 2 + 0.01);
    return g;
  },
  desk: () => {
    const g = new THREE.Group();
    box(g, 1.0, 0.04, 0.55, C.woodLight, 0, 0.72, 0);
    box(g, 0.04, 0.72, 0.55, C.white, -0.48, 0, 0);
    box(g, 0.04, 0.72, 0.55, C.white, 0.48, 0, 0);
    box(g, 0.5, 0.3, 0.03, C.dark, 0, 0.88, -0.18);
    box(g, 0.06, 0.12, 0.06, C.dark, 0, 0.76, -0.18);
    return g;
  },
  chair: (it) => chair(it.color),
  sofa: (it) => {
    const g = new THREE.Group();
    const w = it.w || 2.0, d = it.d || 0.9, col = it.color || C.fabric;
    box(g, w, 0.2, d, C.dark, 0, 0.02, 0);
    box(g, w - 0.3, 0.2, d - 0.25, col, 0, 0.22, 0.1);
    box(g, w, 0.55, 0.22, col, 0, 0.22, -d / 2 + 0.11);
    box(g, 0.16, 0.38, d, col, -w / 2 + 0.08, 0.22, 0);
    box(g, 0.16, 0.38, d, col, w / 2 - 0.08, 0.22, 0);
    box(g, 0.42, 0.32, 0.12, "#d8cbb4", -w / 4, 0.42, -d / 2 + 0.3);
    box(g, 0.42, 0.32, 0.12, "#e2b37a", w / 4, 0.42, -d / 2 + 0.3);
    return g;
  },
  armchair: (it) => {
    const g = new THREE.Group();
    const col = it.color || C.fabricWarm;
    box(g, 0.78, 0.4, 0.78, col, 0, 0.05, 0);
    box(g, 0.78, 0.45, 0.18, col, 0, 0.45, -0.3);
    box(g, 0.14, 0.25, 0.78, col, -0.32, 0.45, 0);
    box(g, 0.14, 0.25, 0.78, col, 0.32, 0.45, 0);
    for (const x of [-0.33, 0.33]) for (const z of [-0.33, 0.33]) cyl(g, 0.02, 0.02, 0.05, C.dark, x, 0, z, 8);
    return g;
  },
  coffee: (it) => {
    const g = new THREE.Group();
    const w = it.w || 0.55, d = it.d || 1.0;
    box(g, w, 0.04, d, C.wood, 0, 0.4, 0);
    box(g, w - 0.1, 0.03, d - 0.1, C.wood, 0, 0.12, 0);
    for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) for (const z of [-d / 2 + 0.04, d / 2 - 0.04]) box(g, 0.03, 0.4, 0.03, C.dark, x, 0, z);
    cyl(g, 0.06, 0.05, 0.12, "#d9cfc0", 0, 0.44, 0);
    return g;
  },
  dining: (it) => {
    const g = new THREE.Group();
    const w = it.w || 1.2, d = it.d || 0.8;
    box(g, w, 0.05, d, C.woodLight, 0, 0.72, 0);
    for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) for (const z of [-d / 2 + 0.06, d / 2 - 0.06]) box(g, 0.05, 0.72, 0.05, C.dark, x, 0, z);
    // stullar
    const seats = it.seats || 4;
    const long = w >= d ? "x" : "z";
    const L = long === "x" ? w : d;
    const S = long === "x" ? d : w;
    const ends = seats >= 8 ? 1 : 0;
    const perSide = Math.ceil((seats - ends * 2) / 2);
    const out = S / 2 + 0.28;
    for (let i = 0; i < perSide; i++) {
      const p = -L / 2 + (L / perSide) * (i + 0.5);
      for (const side of [-1, 1]) {
        const c = chair("#e8e2d8");
        if (long === "x") {
          c.position.set(p, 0, side * out);
          c.rotation.y = side < 0 ? 0 : Math.PI;
        } else {
          c.position.set(side * out, 0, p);
          c.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        g.add(c);
      }
    }
    if (ends) {
      for (const side of [-1, 1]) {
        const c = chair("#e8e2d8");
        const o = L / 2 + 0.28;
        if (long === "x") {
          c.position.set(side * o, 0, 0);
          c.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          c.position.set(0, 0, side * o);
          c.rotation.y = side < 0 ? 0 : Math.PI;
        }
        g.add(c);
      }
    }
    // dasturxon ustidagi vaza
    cyl(g, 0.07, 0.05, 0.18, "#e0d6c4", 0, 0.77, 0);
    sphere(g, 0.09, C.green, 0, 1.0, 0);
    return g;
  },
  tv: () => {
    const g = new THREE.Group();
    box(g, 1.6, 0.45, 0.38, C.wood);
    box(g, 1.25, 0.72, 0.04, mat("#111214", { roughness: 0.3 }), 0, 0.75, -0.12);
    box(g, 0.3, 0.3, 0.12, C.dark, 0.55, 0.45, 0.05);
    return g;
  },
  kitchen: (it) => {
    const g = new THREE.Group();
    const w = it.w || 2.4, d = 0.6;
    box(g, w, 0.86, d, "#efebe4");
    box(g, w + 0.02, 0.04, d + 0.02, "#3f3d3a", 0, 0.86, 0.01);
    // plintus chiziqlari (eshiklar)
    const n = Math.round(w / 0.6);
    for (let i = 1; i < n; i++) box(g, 0.01, 0.76, 0.01, "#bdb6ab", -w / 2 + (i * w) / n, 0.06, d / 2 + 0.005);
    // yuqori shkaflar
    box(g, w, 0.7, 0.34, "#efebe4", 0, 1.45, -d / 2 + 0.17);
    // gaz plita va rakovina
    box(g, 0.56, 0.02, 0.5, "#141414", -w / 2 + w * 0.32, 0.9, 0);
    for (const [x, z] of [[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.12], [0.12, 0.12]])
      cyl(g, 0.07, 0.07, 0.01, "#555", -w / 2 + w * 0.32 + x, 0.92, z);
    box(g, 0.5, 0.02, 0.42, mat("#aeb4b9", { metalness: 0.6, roughness: 0.3 }), -w / 2 + w * 0.72, 0.9, 0);
    cyl(g, 0.015, 0.015, 0.28, C.steel, -w / 2 + w * 0.72, 0.9, -0.22, 8);
    return g;
  },
  fridge: () => {
    const g = new THREE.Group();
    box(g, 0.62, 1.95, 0.65, mat("#d7dadd", { metalness: 0.35, roughness: 0.35 }));
    box(g, 0.02, 0.5, 0.03, C.dark, 0.24, 1.2, 0.33);
    box(g, 0.02, 0.3, 0.03, C.dark, 0.24, 0.55, 0.33);
    box(g, 0.6, 0.01, 0.01, "#a0a4a8", 0, 1.05, 0.33);
    return g;
  },
  tub: (it) => {
    const g = new THREE.Group();
    const w = it.w || 1.6, d = it.d || 0.72;
    box(g, w, 0.55, d, C.white);
    box(g, w - 0.14, 0.02, d - 0.14, mat("#a9d3e6", { roughness: 0.1 }), 0, 0.5, 0);
    cyl(g, 0.02, 0.02, 0.25, C.steel, -w / 2 + 0.1, 0.55, 0, 8);
    return g;
  },
  toilet: () => {
    const g = new THREE.Group();
    cyl(g, 0.16, 0.13, 0.4, C.white, 0, 0, 0.05);
    cyl(g, 0.2, 0.18, 0.04, C.white, 0, 0.4, 0.06);
    box(g, 0.42, 0.38, 0.17, C.white, 0, 0.4, -0.2);
    return g;
  },
  sink: () => {
    const g = new THREE.Group();
    box(g, 0.6, 0.8, 0.45, C.woodLight);
    box(g, 0.62, 0.06, 0.47, C.white, 0, 0.8, 0);
    box(g, 0.55, 0.75, 0.02, mat("#cfe3ec", { metalness: 0.5, roughness: 0.05 }), 0, 1.15, -0.22);
    return g;
  },
  plant: () => {
    const g = new THREE.Group();
    cyl(g, 0.17, 0.13, 0.36, "#d8d1c5", 0, 0, 0);
    sphere(g, 0.25, "#5c8a55", 0, 0.68, 0);
    sphere(g, 0.18, "#6d9d63", 0.12, 0.92, 0.05);
    sphere(g, 0.16, "#4f7b49", -0.1, 0.88, -0.06);
    return g;
  },
  rug: (it) => {
    const g = new THREE.Group();
    const m = box(g, it.w || 1.6, 0.012, it.d || 2.2, it.color || "#cbbfae");
    m.castShadow = false;
    return g;
  },
  shoes: () => {
    const g = new THREE.Group();
    box(g, 1.0, 0.85, 0.35, "#ddd6cb");
    box(g, 0.98, 0.01, 0.01, "#a69d90", 0, 0.42, 0.18);
    box(g, 0.5, 0.7, 0.02, mat("#cfe3ec", { metalness: 0.5, roughness: 0.05 }), 0, 1.15, -0.16);
    return g;
  },
  dresser: () => {
    const g = new THREE.Group();
    box(g, 1.0, 0.8, 0.45, C.wood);
    for (const y of [0.25, 0.52]) box(g, 0.96, 0.01, 0.01, "#5b4530", 0, y, 0.23);
    box(g, 0.6, 0.8, 0.03, mat("#cfe3ec", { metalness: 0.5, roughness: 0.05 }), 0, 0.95, -0.2);
    cyl(g, 0.06, 0.05, 0.14, "#e2b37a", 0.32, 0.8, 0);
    return g;
  },
  washer: () => {
    const g = new THREE.Group();
    box(g, 0.6, 0.85, 0.58, C.white);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 24), mat("#7b8a94", { roughness: 0.2 }));
    door.rotation.x = Math.PI / 2;
    door.position.set(0, 0.45, 0.3);
    g.add(door);
    return g;
  },
  balconySet: () => {
    const g = new THREE.Group();
    cyl(g, 0.3, 0.3, 0.03, C.woodLight, 0, 0.7, 0);
    cyl(g, 0.03, 0.03, 0.7, C.dark, 0, 0, 0, 8);
    const a = chair(C.woodLight);
    a.position.set(-0.6, 0, 0);
    a.rotation.y = -Math.PI / 2;
    g.add(a);
    const b = chair(C.woodLight);
    b.position.set(0.6, 0, 0);
    b.rotation.y = Math.PI / 2;
    g.add(b);
    cyl(g, 0.12, 0.09, 0.22, "#c98d5a", 0.0, 0.73, 0);
    sphere(g, 0.1, C.green, 0, 1.0, 0);
    return g;
  },
};

const ROT: Record<NonNullable<Item["r"]>, number> = { N: 0, W: Math.PI / 2, S: Math.PI, E: -Math.PI / 2 };

/* ─────────── devorlar: rasterlash ─────────── */

type CellType = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 bo'sh, 1 devor, 2 eshik, 3 deraza, 4 parapet, 5 balkon eshigi, 6 kirish eshigi
const OPEN_TYPE: Record<Opening["type"], CellType> = { door: 2, window: 3, balcony: 5, entry: 6 };

function distToRect(x: number, z: number, r: Rect) {
  const dx = Math.max(r[0] - x, 0, x - r[2]);
  const dz = Math.max(r[1] - z, 0, z - r[3]);
  return Math.hypot(dx, dz);
}
const inRect = (x: number, z: number, r: Rect) => x >= r[0] && x < r[2] && z >= r[1] && z < r[3];

function buildWalls(apt: Apartment, wallH: number) {
  const rects = apt.spaces.flatMap((s) => s.rects.map((r) => ({ r, balcony: s.kind === "balcony" })));
  const minX = Math.min(...rects.map((o) => o.r[0])) - 0.4;
  const minZ = Math.min(...rects.map((o) => o.r[1])) - 0.4;
  const maxX = Math.max(...rects.map((o) => o.r[2])) + 0.4;
  const maxZ = Math.max(...rects.map((o) => o.r[3])) + 0.4;
  const nx = Math.ceil((maxX - minX) / CELL);
  const nz = Math.ceil((maxZ - minZ) / CELL);
  const grid = new Uint8Array(nx * nz);

  for (let j = 0; j < nz; j++) {
    const z = minZ + (j + 0.5) * CELL;
    for (let i = 0; i < nx; i++) {
      const x = minX + (i + 0.5) * CELL;
      if (rects.some((o) => inRect(x, z, o.r))) continue;
      let dRoom = Infinity;
      let dBal = Infinity;
      for (const o of rects) {
        const dd = distToRect(x, z, o.r);
        if (o.balcony) dBal = Math.min(dBal, dd);
        else dRoom = Math.min(dRoom, dd);
      }
      let t: CellType = 0;
      if (dRoom <= WALL_REACH) t = 1;
      else if (dBal <= 0.1) t = 4;
      if (t === 1) {
        for (const op of apt.openings) if (inRect(x, z, op.rect)) t = OPEN_TYPE[op.type];
      }
      grid[j * nx + i] = t;
    }
  }

  // Bir xil turdagi qatorlarni to'rtburchaklarga birlashtirish
  type R = { i0: number; i1: number; j0: number; j1: number; t: CellType };
  const done: R[] = [];
  let active = new Map<string, R>();
  for (let j = 0; j < nz; j++) {
    const next = new Map<string, R>();
    let i = 0;
    while (i < nx) {
      const t = grid[j * nx + i] as CellType;
      if (!t) { i++; continue; }
      let k = i;
      while (k < nx && grid[j * nx + k] === t) k++;
      const key = `${i}:${k}:${t}`;
      const prev = active.get(key);
      if (prev) { prev.j1 = j + 1; next.set(key, prev); active.delete(key); }
      else next.set(key, { i0: i, i1: k, j0: j, j1: j + 1, t });
      i = k;
    }
    active.forEach((r) => done.push(r));
    active = next;
  }
  active.forEach((r) => done.push(r));

  const solid: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  const add = (arr: THREE.BufferGeometry[], r: R, y0: number, y1: number, inset = 0) => {
    if (y1 - y0 < 0.01) return;
    const w = (r.i1 - r.i0) * CELL, d = (r.j1 - r.j0) * CELL;
    const gw = Math.max(0.02, w - (w < d ? inset : 0)), gd = Math.max(0.02, d - (d <= w ? inset : 0));
    const g = new THREE.BoxGeometry(gw, y1 - y0, gd);
    g.translate(minX + (r.i0 * CELL + w / 2), y0 + (y1 - y0) / 2, minZ + (r.j0 * CELL + d / 2));
    arr.push(g);
  };
  for (const r of done) {
    if (r.t === 1) add(solid, r, 0, wallH);
    else if (r.t === 2 || r.t === 6 || r.t === 5) add(solid, r, Math.min(2.1, wallH), wallH);
    else if (r.t === 3) {
      add(solid, r, 0, Math.min(0.9, wallH));
      add(solid, r, Math.min(2.2, wallH), wallH);
      add(glass, r, 0.9, Math.min(2.2, wallH), CELL * 1.4);
    } else if (r.t === 4) {
      add(solid, r, 0, 0.55);
      add(glass, r, 0.55, 1.05);
    }
  }
  return { solid, glass, bounds: { minX, minZ, maxX, maxZ } };
}

/* ─────────── eshik tavaqalari ─────────── */

function doorLeaves(apt: Apartment, group: THREE.Group) {
  for (const op of apt.openings) {
    if (op.type === "window") continue;
    const [x0, z0, x1, z1] = op.rect;
    const horiz = x1 - x0 > z1 - z0;
    const len = (horiz ? x1 - x0 : z1 - z0) - 0.08;
    const color = op.type === "entry" ? "#5b4230" : op.type === "balcony" ? "#ffffff" : "#e7e1d7";
    const leafMat = op.type === "balcony" ? mat("#bfe0ef", { transparent: true, opacity: 0.45, roughness: 0.05 }) : mat(color);
    const pivot = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(len, 2.05, 0.04), leafMat);
    leaf.position.set(len / 2, 1.025, 0);
    leaf.castShadow = true;
    pivot.add(leaf);
    if (op.type !== "balcony") {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.06), mat(C.steel, { metalness: 0.8, roughness: 0.3 }));
      handle.position.set(len - 0.08, 1.0, 0);
      pivot.add(handle);
    }
    const s = op.swing || 1;
    if (horiz) {
      pivot.position.set(x0 + 0.04, 0, (z0 + z1) / 2);
      pivot.rotation.y = -s * 1.15;
    } else {
      pivot.position.set((x0 + x1) / 2, 0, z0 + 0.04);
      pivot.rotation.y = -Math.PI / 2 + s * 1.15;
    }
    group.add(pivot);
  }
}

/* ─────────── xonadonni qurish ─────────── */

const FLOOR: Record<RoomKind, "wood" | "tile" | "deck"> = {
  living: "wood", bedroom: "wood", kids: "wood", hall: "wood", kitchen: "tile", bath: "tile", balcony: "deck",
};

function buildApartment(apt: Apartment, cutaway: boolean, labels: boolean) {
  const root = new THREE.Group();
  const tex = floorTextures();
  const wallH = cutaway ? CUT : H;

  // Pollar
  for (const s of apt.spaces) {
    for (const r of s.rects) {
      const w = r[2] - r[0], d = r[3] - r[1];
      const t = tex[FLOOR[s.kind]].clone();
      t.needsUpdate = true;
      t.repeat.set(w / 2, d / 2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, d + 0.14), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(r[0] + w / 2, 0.002, r[1] + d / 2);
      m.receiveShadow = true;
      root.add(m);
    }
  }

  // Devorlar
  const { solid, glass, bounds } = buildWalls(apt, wallH);
  const wallMesh = new THREE.Mesh(mergeGeometries(solid), mat("#f4f1ea", { roughness: 0.9 }));
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  root.add(wallMesh);
  // Devor kesimi ustidagi to'q chiziq (chizma effekti)
  const capGeo = mergeGeometries(
    solid.map((g) => {
      g.computeBoundingBox();
      const b = g.boundingBox!;
      if (b.max.y < wallH - 0.01) return null;
      const c = new THREE.BoxGeometry(b.max.x - b.min.x, 0.012, b.max.z - b.min.z);
      c.translate((b.max.x + b.min.x) / 2, wallH + 0.006, (b.max.z + b.min.z) / 2);
      return c;
    }).filter(Boolean) as THREE.BufferGeometry[]
  );
  root.add(new THREE.Mesh(capGeo, mat("#3a3936")));
  if (glass.length) {
    root.add(new THREE.Mesh(mergeGeometries(glass), mat("#a8d4ea", { transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1 })));
  }

  doorLeaves(apt, root);

  // Mebellar
  for (const it of apt.items) {
    const g = builders[it.t](it);
    g.position.set(it.x, 0, it.z);
    g.rotation.y = it.r ? ROT[it.r] : 0;
    if (it.t === "rug") g.position.y = 0.003;
    root.add(g);
  }

  // Xona nomlari
  if (labels) {
    for (const s of apt.spaces) {
      const r = s.rects[0];
      const el = document.createElement("div");
      el.className = "room-label";
      el.innerHTML = `<b>${s.name}</b><span>${s.area.toFixed(2)} m²</span>`;
      const o = new CSS2DObject(el);
      o.position.set((r[0] + r[2]) / 2, wallH + 0.25, (r[1] + r[3]) / 2);
      root.add(o);
    }
  }

  // Markazga keltirish
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  root.position.set(-cx, 0, -cz);
  const size = Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 0.92;
  return { root, size };
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mt = m.material as THREE.MeshStandardMaterial | undefined;
    if (mt && mt.map) { mt.map.dispose(); mt.dispose(); }
    if (c instanceof CSS2DObject) c.element.remove();
  });
}

/* ─────────── React komponent ─────────── */

export default function Viewer3D({ apt, cutaway, labels, mode, onReady }: ViewerProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const ctx = useRef<{
    renderer: THREE.WebGLRenderer;
    labelR: CSS2DRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    current?: THREE.Group;
    size: number;
    visible: boolean;
    raf: number;
  } | null>(null);

  // Sahna bir marta yaratiladi
  useEffect(() => {
    const el = wrap.current!;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const labelR = new CSS2DRenderer();
    labelR.domElement.className = "labels-layer";
    el.appendChild(labelR.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight("#ffffff", "#8a7f70", 1.35));
    const sun = new THREE.DirectionalLight("#fff2dd", 2.1);
    sun.position.set(-6, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = sc.bottom = -10;
    sc.right = sc.top = 10;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#dfe8ff", 0.5);
    fill.position.set(8, 6, -6);
    scene.add(fill);

    // Asos (yer)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.ShadowMaterial({ opacity: 0.18 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.8, 0.3, 64), mat("#2a2b31", { roughness: 1 }));
    slab.position.y = -0.16;
    slab.receiveShadow = true;
    scene.add(slab);

    const controls = new OrbitControls(camera, labelR.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.target.set(0, 0.6, 0);
    const stop = () => (controls.autoRotate = false);
    controls.addEventListener("start", stop);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      labelR.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const state: NonNullable<typeof ctx.current> = { renderer, labelR, scene, camera, controls, size: 12, visible: true, raf: 0 };
    ctx.current = state;

    const io = new IntersectionObserver(([e]) => (state.visible = e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    const loop = () => {
      state.raf = requestAnimationFrame(loop);
      if (!state.visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
      labelR.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      if (state.current) disposeTree(state.current);
      renderer.dispose();
      el.innerHTML = "";
      ctx.current = null;
    };
  }, []);

  // Xonadon / sozlamalar o'zgarganda qayta qurish
  useEffect(() => {
    const s = ctx.current;
    if (!s) return;
    if (s.current) {
      s.scene.remove(s.current);
      disposeTree(s.current);
    }
    const { root, size } = buildApartment(apt, cutaway, labels);
    s.scene.add(root);
    s.current = root;
    s.size = size;
    // "Past devor" rejimida baland mebellar ham shu balandlikda kesiladi (ichi yaxshi ko'rinadi)
    s.renderer.clippingPlanes = cutaway ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT + 0.2)] : [];
    onReady?.();
  }, [apt, cutaway, labels, onReady]);

  // Kamera holati
  useEffect(() => {
    const s = ctx.current;
    if (!s) return;
    // Xonadonni to'liq sig'dirish: radius va kameraning tor burchagi bo'yicha
    const r = s.size / 2;
    const vf = THREE.MathUtils.degToRad(s.camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * s.camera.aspect);
    const d = (r / Math.sin(Math.min(vf, hf))) * (s.camera.aspect < 1 ? 0.95 : 0.78);
    if (mode === "top") {
      s.camera.position.set(0, d * 1.02, 0.01);
      s.controls.autoRotate = false;
    } else {
      s.camera.position.set(d * 0.42, d * 0.68, d * 0.6);
    }
    s.controls.target.set(0, 0.6, 0);
    s.controls.update();
  }, [mode, apt]);

  return <div ref={wrap} className="viewer3d" />;
}
