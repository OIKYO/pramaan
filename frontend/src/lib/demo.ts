// The shared demo's accounts. The password is public on purpose (it's in the README): Northfield
// Academy is made up, and the server switches off whatever would spoil it for the next person.
export const DEMO_PASSWORD = "Northfield-demo-2026";

export const DEMO_ACCOUNTS = [
  { email: "hq@pramaan.demo", name: "Oikyo Chowdhury", role: "Head office", where: "Northfield Academy", lead: true },
  { email: "regional.east@pramaan.demo", name: "Rishav Nandi", role: "Regional manager", where: "East region", lead: false },
  { email: "staff.siliguri@pramaan.demo", name: "Rudrapriyo Chatterjee", role: "Branch staff", where: "Siliguri branch", lead: false },
  { email: "staff.kolkata@pramaan.demo", name: "Zihan Sirat", role: "Branch staff", where: "Kolkata branch", lead: false },
] as const;
