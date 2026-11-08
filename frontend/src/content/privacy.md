# Privacy policy

**Last changed: 8 November 2026**

This policy explains what information Pramaan handles, why it is needed, where it is stored and who can access it.

## Who we are

Pramaan is a pilot built and run by team HEISEN-DE-BUG for CodeNexus India 2026: Oikyo Chowdhury, Rishav Nandi, Rudrapriyo Chatterjee and Zihan Sirat, based in India. It is not yet operated by a registered company, so the team is responsible for the information Pramaan handles.

For the information an organisation puts into Pramaan (its posters, people register, consent files and approved records), the organisation decides what goes in and why. We handle that information only to run Pramaan for the organisation.

## 1. Information we handle

Depending on how your organisation uses Pramaan, we handle:

- **Account information:** your name, work email, role, branch or region, when your account was created, whether you still have a temporary password, and whether your access was removed. Your password is handled by Supabase (see section 6). We don't ask for phone numbers or home addresses.
- **Organisation information:** organisation name, industry, type, branches, regional structure, rulebooks and the approved records entered by head office.
- **Poster information:** uploaded poster images, captions, alt text, selected publication channels and information about people tagged on posters.
- **Checking results:** text and numbers read from posters, passed checks, warnings, blocking problems, explanations and suggested fixes.
- **People and consent information:** entries in the organisation's people register and the corresponding signed consent files.
- **Team and invitation information:** team roles, branch assignments, invites and join-code activity.
- **Audit information:** status changes, reviews, overrides, data imports, invitations and AI calls, including which model was used, which image it read and when.
- **Browser information:** your sign-in session, theme and animation choices, and whether the cookie notice has been dismissed (see the [cookies page](/legal/cookies)).

Our hosting providers keep standard request logs, such as IP address, time and which page or address was requested, for security and troubleshooting. Pramaan itself remembers the IP address of anyone using the join pages for ten minutes, to stop repeated guessing of join codes.

## 2. Why we use this information

Pramaan uses organisation information to configure its rulebooks and manage branches, people and teams.

Poster images and captions are processed so the system can read the content and compare it with the organisation's approved records. Checking results are stored so branch staff can correct posters and reviewers can inspect findings.

The people register and consent files are used to check whether people shown on posters have the required consent for the selected publication channel.

Team and invitation information is used to manage access. The audit log records actions and decisions so the organisation can review what happened.

We don't sell information, use it for advertising, or use it to train AI models ourselves.

## 3. Where information is stored and processed

Pramaan currently uses these services:

- **Supabase:** hosted Postgres database, file storage and sign-in, in Amazon Web Services' Mumbai region (India).
- **Vercel:** hosts the website, served from its global network.
- **Render:** runs the poster-checking service, in Singapore.
- **Google Gemini:** reads poster images and captions.
- **Groq:** provides a backup model when Gemini is busy.
- **Google Fonts:** supplies the fonts used by the website.

Google and Groq process poster images in their own data centres, which may be outside India. Each provider's own terms apply to what it does with the information it receives.

## 4. What is sent to AI

The poster image and its caption are sent to the AI model used for reading the poster.

The people register and consent files are never sent to an AI model.

Pramaan uses Gemini for the initial reading. If Gemini is busy, a backup model on Groq reads the poster instead. The same image is not sent to the AI twice; the reading is reused.

During the pilot, Pramaan uses free AI tiers. Under the [Gemini API terms](https://ai.google.dev/gemini-api/terms), Google may use free-tier inputs to improve its models. Groq's handling is described in its [privacy policy](https://groq.com/privacy-policy/). This is why the demo organisation is fictional and why organisations must not upload real personal data during the pilot.

## 5. Who can access information

Access within an organisation is separated by role:

- Branch staff can see their branch's posters.
- Regional managers can see posters belonging to their region.
- Head office can access the organisation's information.

Organisations are isolated at the database level. Every table carries an organisation identifier, and access rules restrict information to the relevant organisation.

Consent files are stored privately. Only head office can open them, using links that expire after a few minutes.

The Pramaan team can reach the database and file storage to run and fix the service. We don't look at an organisation's posters, people or records unless the organisation asks us to help with a problem.

## 6. Passwords and browser storage

Pramaan does not store passwords itself. Sign-in is handled by Supabase, which stores passwords in hashed form. Passwords must contain at least eight characters, including a number and a special character. The organisation password, created when an organisation is set up, can't be recovered if it is forgotten.

Your browser keeps your sign-in session, your theme and animation choices, and whether you've dismissed the cookie notice. Pramaan does not use advertising or tracking cookies and does not use analytics. The [cookies page](/legal/cookies) lists exactly what is kept.

## 7. How long information is kept

We keep an organisation's information for as long as the organisation is on Pramaan.

- When head office deletes the organisation, its records, posters, checking results, people register, consent files, logo, invites, audit log and every member's sign-in are deleted at once.
- When you delete your account, your name and email are removed straight away and you can no longer sign in. Posters and reviews you made stay in your organisation's history, shown as made by a former member.
- When head office removes someone's access, their account stays, so the organisation's history still shows who did what.
- Our database provider may keep backups for a short time; deleted information disappears from them as they expire.
- If the pilot ends, we'll tell head offices in Pramaan before deleting every organisation's information.

## 8. Removing information and access

- **Your account:** Settings › Delete my account. If you're your organisation's only head office, make someone else head office first, or delete the organisation.
- **Your organisation:** head office can delete it from Organisation › Profile › Delete organisation. This can't be undone.
- **Someone else's access:** head office can remove it from the Team page at once. Their history remains in the audit log.
- **Anything else:** ask us through the contact route in section 11.

## 9. Information about minors

Pramaan accounts are for an organisation's staff. Children may appear on posters only with a parent's or guardian's signed consent: the people-and-consent checks require a guardian to sign consent for a minor, the consent must cover the publication channel and be in date, and for results it must be given after the result.

Pramaan does not recognise faces. Staff must identify the people shown by tagging them.

## 10. Changes to this policy

When this policy changes, we'll update the date at the top. If a change affects how your information is used, we'll say so in Pramaan before it takes effect.

## 11. Contact

For questions about Pramaan or this policy, use the [GitHub issues page](https://github.com/OIKYO/pramaan/issues). For anything private, open an issue saying you need to reach us privately, without including personal details, and the team will reply with a private way to talk.
