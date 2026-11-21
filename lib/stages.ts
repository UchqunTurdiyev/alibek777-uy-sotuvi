// Brauzer va server uchun umumiy: CRM bosqichlari (MongoDB importisiz)

// CRM ustunlari (bosqichlar). Tartib — paneldagi ustunlar tartibi.
export const STAGES = [
  { key: "new", label: "Lid", color: "#d6b26a" },
  { key: "no_answer", label: "Ko'tarmadi", color: "#8f96a3" },
  { key: "thinking", label: "O'ylab ko'radi", color: "#e0a458" },
  { key: "qualified", label: "Qiziqdi (sifatli)", color: "#4fb477" },
  { key: "viewing", label: "Ko'rikka keladi", color: "#5aa9e6" },
  { key: "later", label: "Keyinroq", color: "#b38cd9" },
  { key: "purchased", label: "Sotib oldi", color: "#3ccf8e" },
  { key: "disqualified", label: "Olmaydi", color: "#e5675a" },
] as const;

export type LeadStatus = (typeof STAGES)[number]["key"];
export const STATUS_KEYS = STAGES.map((s) => s.key) as LeadStatus[];
export const isStatus = (v: unknown): v is LeadStatus => STATUS_KEYS.includes(v as LeadStatus);
export const stageLabel = (s: LeadStatus) => STAGES.find((x) => x.key === s)?.label || s;
