// Xonadonlar rejasi — "Blok-1, 5-qavat" chizmasidan (metrlarda) olingan.
// Koordinatalar: x — o'ngga, z — pastga (chizma bo'yicha), har bir xonadon (0,0) dan boshlanadi.
// Xona to'rtburchaklari orasidagi bo'shliq (~12 sm) avtomatik devorga aylanadi.

export type RoomKind = "living" | "bedroom" | "kids" | "kitchen" | "hall" | "bath" | "balcony";

export type Rect = [x0: number, z0: number, x1: number, z1: number];

export type Room = { name: string; area: number; kind: RoomKind; rects: Rect[] };

// door — eshik, entry — kirish eshigi, window — deraza, balcony — balkon eshigi (oynali)
export type Opening = { type: "door" | "entry" | "window" | "balcony"; rect: Rect; swing?: 1 | -1 };

export type FurnitureType =
  | "bed2" | "bed1" | "nightstand" | "wardrobe" | "desk" | "chair" | "sofa" | "armchair"
  | "coffee" | "dining" | "tv" | "kitchen" | "fridge" | "tub" | "toilet" | "sink"
  | "plant" | "rug" | "shoes" | "dresser" | "washer" | "balconySet";

// x, z — markaz; r — orqa tomoni qaysi devorga qaragan: N (yuqori), S (past), W (chap), E (o'ng)
// w, d — o'lcham (mahalliy: w — eni, d — chuqurligi); seats — stol atrofidagi stullar soni
export type Item = { t: FurnitureType; x: number; z: number; r?: "N" | "S" | "W" | "E"; w?: number; d?: number; seats?: number; color?: string };

export type Apartment = {
  id: string;
  title: string;
  rooms: number;
  area: number;
  note: string;
  spaces: Room[];
  openings: Opening[];
  items: Item[];
};

export const APARTMENTS: Apartment[] = [
  /* ───────────────────────── 3 xonali — 87.70 m² ───────────────────────── */
  {
    id: "3x",
    title: "3 xonali",
    rooms: 3,
    area: 87.7,
    note: "Katta oila uchun: ikki yotoqxona, alohida mehmonxona va ikki balkon",
    spaces: [
      { name: "Oshxona", area: 10.9, kind: "kitchen", rects: [[0, 1.52, 2.95, 5.2]] },
      { name: "Bolalar xonasi", area: 17.5, kind: "kids", rects: [[3.08, 0, 5.93, 6.03]] },
      { name: "Yotoqxona", area: 18.25, kind: "bedroom", rects: [[6.06, 0, 9.09, 6.03]] },
      { name: "Mehmonxona", area: 17.5, kind: "living", rects: [[9.22, 1.48, 11.98, 7.72]] },
      { name: "Yo'lak", area: 12.5, kind: "hall", rects: [[1.83, 6.15, 9.09, 7.64], [1.83, 5.32, 2.95, 6.15]] },
      { name: "Hammom", area: 3.65, kind: "bath", rects: [[0, 5.32, 1.71, 7.64]] },
      { name: "Balkon", area: 3.5, kind: "balcony", rects: [[-0.2, 0.05, 2.95, 1.32]] },
      { name: "Lodjiya", area: 3.9, kind: "balcony", rects: [[9.22, 0.0, 11.98, 1.28]] },
    ],
    openings: [
      { type: "entry", rect: [7.9, 7.55, 8.8, 7.9], swing: -1 },
      { type: "door", rect: [1.95, 5.1, 2.8, 5.4] },
      { type: "door", rect: [1.6, 5.8, 1.95, 6.6], swing: -1 },
      { type: "door", rect: [4.95, 5.95, 5.8, 6.25], swing: -1 },
      { type: "door", rect: [6.2, 5.95, 7.05, 6.25], swing: -1 },
      { type: "door", rect: [9.0, 6.5, 9.3, 7.35] },
      { type: "balcony", rect: [0.6, 1.25, 1.4, 1.6] },
      { type: "window", rect: [1.55, 1.25, 2.5, 1.6] },
      { type: "balcony", rect: [10.0, 1.2, 10.85, 1.55] },
      { type: "window", rect: [10.95, 1.2, 11.8, 1.55] },
      { type: "window", rect: [3.6, -0.3, 5.4, 0.05] },
      { type: "window", rect: [6.8, -0.3, 8.4, 0.05] },
    ],
    items: [
      // Oshxona
      { t: "fridge", x: 0.32, z: 1.88, r: "W" },
      { t: "kitchen", x: 0.3, z: 3.65, r: "W", w: 2.9 },
      { t: "dining", x: 1.95, z: 3.1, r: "W", w: 1.2, d: 0.8, seats: 4 },
      // Bolalar xonasi
      { t: "bed1", x: 3.98, z: 2.05, r: "W" },
      { t: "bed1", x: 3.98, z: 4.0, r: "W", color: "#9fb7c9" },
      { t: "nightstand", x: 3.3, z: 3.03, r: "W" },
      { t: "desk", x: 3.65, z: 0.3, r: "N" },
      { t: "chair", x: 3.65, z: 0.85, r: "S" },
      { t: "desk", x: 5.35, z: 0.3, r: "N" },
      { t: "chair", x: 5.35, z: 0.85, r: "S" },
      { t: "wardrobe", x: 3.85, z: 5.73, r: "S", w: 1.4 },
      { t: "rug", x: 5.0, z: 3.0, w: 1.2, d: 1.8, color: "#c9d8c5" },
      // Yotoqxona
      { t: "bed2", x: 8.0, z: 3.25, r: "E" },
      { t: "nightstand", x: 8.85, z: 2.05, r: "E" },
      { t: "nightstand", x: 8.85, z: 4.45, r: "E" },
      { t: "wardrobe", x: 8.79, z: 0.95, r: "E", w: 1.6 },
      { t: "dresser", x: 6.55, z: 0.25, r: "N" },
      { t: "tv", x: 6.15, z: 3.25, r: "W" },
      { t: "wardrobe", x: 7.75, z: 5.73, r: "S", w: 1.4 },
      { t: "rug", x: 6.9, z: 3.25, w: 1.4, d: 2.2, color: "#d8c8b0" },
      // Mehmonxona
      { t: "dining", x: 10.6, z: 3.9, r: "N", w: 1.0, d: 2.4, seats: 8 },
      { t: "sofa", x: 11.6, z: 6.4, r: "E", w: 2.0 },
      { t: "tv", x: 9.37, z: 6.4, r: "W" },
      { t: "coffee", x: 10.55, z: 6.4 },
      { t: "plant", x: 11.7, z: 1.8 },
      { t: "rug", x: 10.6, z: 6.4, w: 1.8, d: 2.2, color: "#cbbfae" },
      // Yo'lak
      { t: "wardrobe", x: 3.9, z: 7.34, r: "S", w: 1.4, d: 0.55 },
      { t: "shoes", x: 7.3, z: 7.45, r: "S" },
      // Hammom
      { t: "tub", x: 0.86, z: 5.7, w: 1.6 },
      { t: "toilet", x: 0.28, z: 6.6, r: "W" },
      { t: "sink", x: 1.15, z: 7.4, r: "S" },
      // Balkonlar
      { t: "balconySet", x: 1.4, z: 0.7 },
      { t: "armchair", x: 10.2, z: 0.6, r: "N" },
      { t: "armchair", x: 11.3, z: 0.6, r: "N" },
      { t: "plant", x: 9.5, z: 0.45 },
    ],
  },

  /* ───────────────────────── 2 xonali — 61.60 m² ───────────────────────── */
  {
    id: "2x",
    title: "2 xonali",
    rooms: 2,
    area: 61.6,
    note: "Yosh oila uchun: keng mehmonxona, yotoqxona va balkonli oshxona",
    spaces: [
      { name: "Yo'lak", area: 11.4, kind: "hall", rects: [[1.83, 0, 9.09, 1.5]] },
      { name: "Hammom", area: 3.6, kind: "bath", rects: [[0, 0, 1.71, 2.43]] },
      { name: "Oshxona", area: 10.1, kind: "kitchen", rects: [[0, 2.54, 2.95, 5.59], [1.83, 1.61, 2.95, 2.54]] },
      { name: "Mehmonxona", area: 16.1, kind: "living", rects: [[3.08, 1.61, 5.93, 7.1]] },
      { name: "Yotoqxona", area: 16.7, kind: "bedroom", rects: [[6.06, 1.61, 9.09, 7.1]] },
      { name: "Balkon", area: 3.5, kind: "balcony", rects: [[-0.2, 5.8, 2.95, 7.1]] },
    ],
    openings: [
      { type: "entry", rect: [5.9, -0.3, 6.8, 0.05] },
      { type: "door", rect: [1.6, 0.25, 1.95, 1.05] },
      { type: "door", rect: [1.95, 1.4, 2.8, 1.7] },
      { type: "door", rect: [4.95, 1.4, 5.8, 1.7] },
      { type: "door", rect: [6.2, 1.4, 7.05, 1.7] },
      { type: "window", rect: [3.9, 7.0, 5.3, 7.35] },
      { type: "window", rect: [6.8, 7.0, 8.3, 7.35] },
      { type: "balcony", rect: [0.75, 5.5, 1.5, 5.9] },
      { type: "window", rect: [1.6, 5.5, 2.45, 5.9] },
    ],
    items: [
      // Oshxona
      { t: "fridge", x: 2.63, z: 1.95, r: "E" },
      { t: "kitchen", x: 2.65, z: 4.0, r: "E", w: 2.7 },
      { t: "dining", x: 0.95, z: 3.75, r: "W", w: 1.2, d: 0.8, seats: 4 },
      // Mehmonxona
      { t: "sofa", x: 3.5, z: 3.0, r: "W", w: 2.1 },
      { t: "coffee", x: 4.45, z: 3.0 },
      { t: "tv", x: 5.78, z: 3.0, r: "E" },
      { t: "rug", x: 4.4, z: 3.0, w: 1.7, d: 2.2, color: "#cbbfae" },
      { t: "dining", x: 4.5, z: 5.5, r: "N", w: 0.9, d: 1.8, seats: 6 },
      { t: "plant", x: 5.65, z: 6.8 },
      // Yotoqxona
      { t: "wardrobe", x: 7.9, z: 1.92, r: "N", w: 1.6 },
      { t: "bed2", x: 8.0, z: 4.35, r: "E" },
      { t: "nightstand", x: 8.85, z: 3.15, r: "E" },
      { t: "nightstand", x: 8.85, z: 5.55, r: "E" },
      { t: "tv", x: 6.15, z: 4.35, r: "W" },
      { t: "armchair", x: 6.65, z: 6.6, r: "S" },
      { t: "coffee", x: 7.5, z: 6.65, w: 0.5, d: 0.5 },
      { t: "armchair", x: 8.35, z: 6.6, r: "S" },
      { t: "rug", x: 7.0, z: 4.35, w: 1.4, d: 2.2, color: "#d8c8b0" },
      // Yo'lak
      { t: "wardrobe", x: 8.2, z: 0.3, r: "N", w: 1.5, d: 0.55 },
      { t: "shoes", x: 4.6, z: 0.22, r: "N" },
      // Hammom
      { t: "toilet", x: 0.6, z: 0.28, r: "N" },
      { t: "sink", x: 0.27, z: 1.0, r: "W" },
      { t: "tub", x: 0.86, z: 2.05, w: 1.6 },
      // Balkon
      { t: "balconySet", x: 1.4, z: 6.45 },
    ],
  },

  /* ───────────────────────── 1 xonali — 49.30 m² ───────────────────────── */
  {
    id: "1x-49",
    title: "1 xonali · 49.30",
    rooms: 1,
    area: 49.3,
    note: "Keng oshxona-mehmonxona, alohida yotoqxona va balkon",
    spaces: [
      { name: "Oshxona-mehmonxona", area: 15.85, kind: "kitchen", rects: [[0, 0, 2.59, 6.03]] },
      { name: "Yotoqxona", area: 14.45, kind: "bedroom", rects: [[2.71, 0, 5.65, 4.87]] },
      { name: "Yo'lak", area: 11.2, kind: "hall", rects: [[2.71, 4.97, 5.65, 7.58], [5.65, 6.28, 8.55, 7.58]] },
      { name: "Hammom", area: 3.7, kind: "bath", rects: [[0, 6.13, 2.59, 7.58]] },
      { name: "Balkon", area: 4.1, kind: "balcony", rects: [[-0.2, -1.5, 2.59, -0.2]] },
    ],
    openings: [
      { type: "entry", rect: [8.45, 6.55, 8.8, 7.4] },
      { type: "door", rect: [2.5, 5.05, 2.8, 5.9], swing: -1 },
      { type: "door", rect: [2.5, 6.5, 2.8, 7.3], swing: -1 },
      { type: "door", rect: [4.2, 4.8, 5.05, 5.05], swing: -1 },
      { type: "balcony", rect: [1.5, -0.3, 2.25, 0.05] },
      { type: "window", rect: [0.6, -0.3, 1.4, 0.05] },
      { type: "window", rect: [3.6, -0.3, 4.9, 0.05] },
    ],
    items: [
      // Oshxona-mehmonxona
      { t: "kitchen", x: 0.3, z: 1.9, r: "W", w: 3.0 },
      { t: "fridge", x: 0.32, z: 3.75, r: "W" },
      { t: "dining", x: 1.85, z: 2.4, r: "W", w: 1.2, d: 0.75, seats: 4 },
      { t: "sofa", x: 0.45, z: 5.0, r: "W", w: 1.8 },
      { t: "coffee", x: 1.4, z: 5.0, w: 0.5, d: 0.8 },
      { t: "tv", x: 2.44, z: 4.4, r: "E" },
      { t: "rug", x: 1.4, z: 5.0, w: 1.3, d: 1.8, color: "#cbbfae" },
      // Yotoqxona
      { t: "bed2", x: 3.75, z: 2.4, r: "W" },
      { t: "nightstand", x: 2.95, z: 1.25, r: "W" },
      { t: "nightstand", x: 2.95, z: 3.55, r: "W" },
      { t: "wardrobe", x: 3.45, z: 4.57, r: "S", w: 1.4 },
      { t: "dresser", x: 5.4, z: 2.4, r: "E" },
      { t: "plant", x: 5.35, z: 0.35 },
      { t: "rug", x: 4.75, z: 2.4, w: 1.2, d: 2.0, color: "#d8c8b0" },
      // Yo'lak
      { t: "wardrobe", x: 6.6, z: 6.56, r: "N", w: 1.6, d: 0.55 },
      { t: "shoes", x: 7.9, z: 7.4, r: "S" },
      // Hammom
      { t: "tub", x: 1.1, z: 6.5, w: 1.7 },
      { t: "toilet", x: 0.45, z: 7.28, r: "S" },
      { t: "sink", x: 1.9, z: 7.33, r: "S" },
      { t: "washer", x: 2.3, z: 6.45, r: "E" },
      // Balkon
      { t: "balconySet", x: 1.2, z: -0.85 },
    ],
  },

  /* ───────────────────────── 1 xonali — 46.50 m² ───────────────────────── */
  {
    id: "1x-46",
    title: "1 xonali · 46.50",
    rooms: 1,
    area: 46.5,
    note: "Ixcham va qulay: oshxona-mehmonxona, yotoqxona, katta balkon",
    spaces: [
      { name: "Oshxona-mehmonxona", area: 14.55, kind: "kitchen", rects: [[0, 1.5, 2.59, 7.09]] },
      { name: "Yotoqxona", area: 12.8, kind: "bedroom", rects: [[2.71, 2.77, 5.65, 7.09]] },
      { name: "Yo'lak", area: 11.4, kind: "hall", rects: [[2.71, 0, 5.65, 2.65], [5.65, 0, 8.55, 1.24]] },
      { name: "Hammom", area: 3.7, kind: "bath", rects: [[0, 0, 2.59, 1.38]] },
      { name: "Balkon", area: 4.08, kind: "balcony", rects: [[-0.2, 7.29, 2.59, 8.6]] },
    ],
    openings: [
      { type: "entry", rect: [8.45, 0.25, 8.8, 1.05] },
      { type: "door", rect: [2.5, 0.3, 2.8, 1.05], swing: -1 },
      { type: "door", rect: [2.5, 1.65, 2.8, 2.45], swing: -1 },
      { type: "door", rect: [4.2, 2.55, 5.05, 2.85] },
      { type: "balcony", rect: [1.5, 7.0, 2.25, 7.4] },
      { type: "window", rect: [0.6, 7.0, 1.4, 7.4] },
      { type: "window", rect: [3.4, 7.0, 4.9, 7.4] },
    ],
    items: [
      // Oshxona-mehmonxona
      { t: "washer", x: 0.32, z: 2.0, r: "W" },
      { t: "kitchen", x: 0.3, z: 4.4, r: "W", w: 3.6 },
      { t: "fridge", x: 2.27, z: 1.85, r: "E" },
      { t: "dining", x: 1.85, z: 4.35, r: "E", w: 1.2, d: 0.75, seats: 4 },
      { t: "plant", x: 2.3, z: 6.75 },
      // Yotoqxona
      { t: "wardrobe", x: 3.45, z: 3.07, r: "N", w: 1.4 },
      { t: "bed2", x: 3.75, z: 5.0, r: "W" },
      { t: "nightstand", x: 2.95, z: 3.85, r: "W" },
      { t: "nightstand", x: 2.95, z: 6.15, r: "W" },
      { t: "dresser", x: 5.4, z: 5.0, r: "E" },
      { t: "rug", x: 4.75, z: 5.0, w: 1.2, d: 2.0, color: "#d8c8b0" },
      // Yo'lak
      { t: "wardrobe", x: 6.8, z: 0.28, r: "N", w: 1.6, d: 0.55 },
      { t: "shoes", x: 4.5, z: 0.2, r: "N" },
      // Hammom
      { t: "toilet", x: 0.55, z: 0.27, r: "N" },
      { t: "tub", x: 1.2, z: 1.03, w: 1.7 },
      { t: "sink", x: 2.3, z: 0.4, r: "E" },
      // Balkon
      { t: "balconySet", x: 1.2, z: 7.95 },
    ],
  },
];
