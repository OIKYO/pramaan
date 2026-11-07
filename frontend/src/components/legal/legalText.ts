/** The legal pages, in plain words. Pramaan is a pilot built for a hackathon, and says so. */
export interface LegalDoc {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: {
    title: "Privacy policy",
    updated: "8 November 2026",
    sections: [
      {
        heading: "Who we are",
        body: [
          "Pramaan is a pilot built by team HEISEN-DE-BUG for CodeNexus India 2026. It is not yet run by a registered company.",
        ],
      },
      {
        heading: "What we keep",
        body: [
          "Your account: your name, email and role. Your organisation's rulebooks, branches and team, the posters you upload, the findings on them, reviews, and an audit log of every decision.",
          "All of it is stored with Supabase (database and file storage). Each organisation sees only its own data, enforced by the database itself.",
        ],
      },
      {
        heading: "What goes to AI",
        body: [
          "Each poster image and its caption are sent once to Google Gemini (or Groq, if Gemini is busy) to be read. Nothing else is: consent files and the people register never leave Pramaan.",
          "The pilot uses free AI tiers, and Google may use free-tier inputs to improve its models. That is why our demo is entirely fictional. Please don't upload real people's details during the pilot.",
        ],
      },
      {
        heading: "Who can see what",
        body: [
          "Branch staff see their branch's posters, regional managers their region's, head office everything in its organisation. Consent files are visible to head office only, through links that expire after a few minutes.",
        ],
      },
      {
        heading: "Removing your data",
        body: [
          "Head office can edit or delete records in the app and remove people's access. To remove a whole organisation, open an issue on our GitHub and we'll delete it.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms",
    updated: "8 November 2026",
    sections: [
      {
        heading: "A pilot, as it is",
        body: [
          "Pramaan is free while it is a pilot. It is provided as it is, without any promise that it is complete, available or free of mistakes, and we may change or end it.",
        ],
      },
      {
        heading: "Pramaan helps; people decide",
        body: [
          "Pramaan points out problems on posters. It is not legal advice, and a poster passing every check is not a guarantee that it is lawful. Approving a poster is your organisation's decision.",
        ],
      },
      {
        heading: "Your part",
        body: [
          "Upload only what you have the right to use, keep your password to yourself, and get people's consent before their details go into Pramaan. Don't upload real personal data during the pilot.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookies",
    updated: "8 November 2026",
    sections: [
      {
        heading: "No tracking",
        body: ["Pramaan has no advertising or tracking cookies and no analytics."],
      },
      {
        heading: "What your browser keeps",
        body: [
          "Your sign-in, so you stay signed in (kept by Supabase in your browser's local storage), and your theme and animation choices. Signing out removes the sign-in.",
        ],
      },
      {
        heading: "Fonts",
        body: ["The typeface, Mona Sans, loads from Google Fonts, so your browser asks Google's servers for it."],
      },
    ],
  },
};
