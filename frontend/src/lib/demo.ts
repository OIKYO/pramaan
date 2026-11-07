/** The demo organisation's accounts (Northfield Academy, fictional; created by backend/scripts/seed.py).
 * Shown on the sign-in page only when VITE_DEMO_PASSWORD is set. */
export const DEMO_PASSWORD: string = import.meta.env.VITE_DEMO_PASSWORD ?? "";

export const DEMO_ACCOUNTS = [
  { email: "staff.siliguri@pramaan.demo", role: "Branch staff", who: "Tara Ghosh, Siliguri branch" },
  { email: "regional.east@pramaan.demo", role: "Regional manager", who: "Vikram Bose, East region" },
  { email: "hq@pramaan.demo", role: "Head office", who: "Meera Iyer" },
] as const;
