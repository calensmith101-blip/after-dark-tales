export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/\+/g, "t")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const BLOCKED_TERMS = [
  "child porn",
  "childporn",
  "csam",
  "underage sex",
  "minor sex",
  "teen porn",
  "schoolgirl porn",
  "schoolboy porn",
  "rape",
  "raped",
  "raping",
  "non consensual",
  "nonconsensual",
  "without consent",
  "forced sex",
  "sexual assault",
  "drugged sex",
  "date rape",
  "bestiality",
  "zoophilia",
  "sex with animal",
  "animal sex",
  "necrophilia",
  "sex with corpse",
  "incest",
  "sex with sister",
  "sex with brother",
  "sex with mother",
  "sex with father",
  "celebrity sex",
  "real person porn",
  "deepfake porn",
  "snuff",
  "graphic torture",
  "terrorist",
  "bomb making",
  "mass shooting",
  "hate speech",
  "racial slur",
  "suicide",
  "kill myself",
];

export function checkContent(input: string): { safe: boolean; highSeverity: boolean } {
  const text = normalise(input);
  for (const term of BLOCKED_TERMS) {
    if (text.includes(term)) {
      const highSeverity = ["child porn", "childporn", "csam", "underage sex", "minor sex"].includes(term);
      return { safe: false, highSeverity };
    }
  }
  return { safe: true, highSeverity: false };
}
