# Pramaan: copy brief

This file is for a copywriter (a person, or ChatGPT). It explains everything about Pramaan that the website's text may say, how it should sound, and exactly which pieces of text are needed. Paste the whole file into the chat and ask for the sections in **Part 4**, in the format in **Part 5**.

**The one rule that matters most:** write only what is true. Everything you need is in Part 2. If something isn't there (a customer count, a certification, a security standard, an uptime promise, an email address, a company address), don't invent it. Leave a note like `[NEED: …]` instead.

---

## Part 1. What Pramaan is, in one paragraph

Pramaan checks every poster that a multi-branch organisation's branches make, before it is published. Branch staff upload a poster. Pramaan reads it, checks it against head office's rulebooks (brand kit, approved prices and figures, a register of people with their consent, dates, offers, permissions and required disclaimers), and marks every problem on the poster with the rule it breaks and the exact fix. A regional manager reviews it, then head office gives final approval. An AI reads the poster; plain code decides whether each rule is met; people approve. **The AI never approves anything.**

The name: *pramaan* (प्रमाण) is Hindi and Sanskrit for proof or evidence.

---

## Part 2. Facts you can use

### Who it's for

- Organisations with many branches that publish their own posters: coaching institutes, schools and colleges, restaurant and retail chains, gyms and fitness chains, clinics, NGOs, and so on. Any organisation can sign up; it picks its industry from 30 industries and about 500 kinds of organisation (or types its own).
- Three roles inside an organisation:
  - **Branch staff** make and upload posters for their branch, and fix what Pramaan finds.
  - **Regional managers** review the posters from branches in their region.
  - **Head office** keeps the rulebooks, manages branches and people, and gives final approval.

### How a poster goes through Pramaan

1. Branch staff upload the poster image, its caption and alt text, choose where it will be published (print, Instagram or WhatsApp), and tag anyone shown on it.
2. **Reading.** Google's Gemini reads the poster once: its text (including Hindi and Bengali), prices, phone numbers, ranks, people and claims. If Gemini is busy, a backup model on Groq reads it instead. The same image is never sent to the AI twice: its reading is reused.
3. **A second reader for key numbers.** Tesseract (open-source text recognition) reads every price, rank, phone number and figure again. If the two readers disagree, Pramaan asks a person to confirm the number instead of guessing.
4. **The checks.** Up to 27 checks run, in plain code, against the rulebooks the organisation keeps. Two of them use the AI's judgement on wording (tone of voice, and disguised guarantees like "selection pakka"); those can only warn, never block.
5. **Findings.** Every problem is boxed on the poster, numbered, with the rule it breaks, why the rule exists, and the exact fix ("Change the rank to AIR 73"). Passed checks are listed too.
6. **Fix and resubmit.** Staff upload a fixed version; it is checked again. Versions can be compared side by side.
7. **Review.** The regional manager approves or sends it back with a comment. Head office gives final approval. Nobody can approve a poster they made. Approval is refused while any blocking problem is open; only head office can override a block, and only with a written reason.
8. Every step, and every AI call (which model, which image, when), is written to an audit log.

### The rulebooks and their 27 checks

A rulebook holds records head office approves, and the checks that use them. Each organisation chooses its rulebooks; its industry and kind of organisation set the starting choice. There are three kinds:

- **Always on** (can't be switched off)
  - **Brand kit:** logo present; colours within the palette; registered name and helpline present; tone of voice (AI, warns only); text contrast at least 4.5:1 (the WCAG minimum); alt text on Instagram and WhatsApp posts.
  - **Branch contact details:** phone numbers and addresses must be the branch's own or the helpline.
  - **Honest claims:** no promised results such as "100% selection" or "guaranteed job", in English, Hindi and Bengali; disguised guarantees flagged by the AI (warns only).
  - **People and consent:** everyone shown must be in the organisation's register with signed consent; consent must cover the channel, be in date, be signed by a guardian for a minor, and (for results) be given after the result. Pramaan does not recognise faces: staff tag who is shown.
  - **Copyright and asset permissions:** no stock-photo watermarks (Shutterstock, Getty and so on); other organisations' names or logos only if head office has listed them as approved partners.
- **When a poster shows it** (act only when the poster has that kind of content)
  - **Offerings and prices:** courses, products or services named and priced exactly as approved, and nothing past its approval date. (It's called "Courses and fees" for a coaching institute, "Menu and prices" for a restaurant, and so on.)
  - **Approved figures:** any statistic quoted must be one head office approved.
  - **Dates, deadlines and availability:** dates must exist (no 31 February), match their weekday, and not have passed.
  - **Offers, discounts and terms:** offers must say how long they last, point to their conditions, and their percentages and savings must add up.
  - **Legal and regulatory compliance:** disclaimers head office requires on every poster must be there; claims an industry may never make (such as "guaranteed returns" in finance or "100% cure" in healthcare) are blocked.
- **For particular industries**
  - **Exam results (coaching ads):** for coaching institutes in India, following the CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024: ranks must match the register, and each topper needs their course, its duration and whether it was paid or free beside them.

### Words that follow the industry

Pramaan uses the organisation's own words: "Courses and fees" and "Toppers register" for a coaching institute; "Menu and prices" for a restaurant; "Memberships and fees" and "Players and consent" for a sports club; "Impact figures" for an NGO.

### Setting up an organisation

- Anyone can create an organisation from the website. They say what it does (industry and kind of organisation) and become its head office. The head office password is called the **organisation password**; it can't be recovered if forgotten.
- A setup checklist walks head office through the brand kit, branches, offerings, people, figures and team.
- **Importing data:** branches, prices, figures, people and team members can be imported from CSV files (what Excel and Google Sheets export). Every row is checked first and every problem is shown by line and column; nothing is saved until the whole file is right.
- **Bringing people in, three ways:**
  - **Invite links.** Head office invites anyone; regional managers invite branch staff for branches in their region. A link is for one person, works once, and expires after 7 days. Only a scrambled (hashed) form of the link is stored.
  - **Join code.** Each organisation has a code (like `K7MQ-X3VP`) visible only inside it. People enter it when they create their account and join as branch staff of the branch they pick. Head office can replace the code at any time if it leaks.
  - **Added by head office** with a temporary password, which the person must change at first sign-in.
- Head office can remove someone's access at once; their history stays in the audit log.

### Data, privacy and security (all true today)

- **Where data lives:** Supabase (a hosted Postgres database and file storage). The app runs on Vercel; the checking service runs on Render.
- **Organisations are isolated** by the database itself: every table carries the organisation, and every access rule starts with "your organisation only". Inside an organisation, branch staff see their branch's posters, regional managers their region's, head office everything.
- **What goes to the AI:** only each poster's image and caption. Consent files and the people register are never sent to any AI.
- **Free AI tiers:** during the pilot, Pramaan uses free tiers, and Google may use free-tier inputs to improve its models. That's why the demo organisation is fictional and why people shouldn't upload real personal data during the pilot.
- **Consent files** are stored privately; only head office can open them, through links that expire after a few minutes.
- **Passwords:** at least 8 characters with a number and a special character. Pramaan doesn't keep passwords itself: sign-in is handled by Supabase, which stores them only in hashed form.
- **Browser storage:** only the sign-in session and the theme and animation choices. No advertising or tracking cookies, no analytics.
- **Fonts** load from Google Fonts.
- **Audit log:** every status change, review, override, data import, invite and AI call is recorded.

### Status, price and people

- Pramaan is a **pilot** built by team **HEISEN-DE-BUG** for **CodeNexus India 2026** (problem statement: Brand Governance, by Inkloom AI). Team: Oikyo Chowdhury (AI and backend), Rishav Nandi (research and rules), Rudrapriyo Chatterjee (frontend), Zihan Sirat (testing and docs).
- It is **free during the pilot**. There are no paid plans yet. Don't invent prices or plan names.
- It is not yet run by a registered company.
- Contact: through the GitHub repository's issues page (`https://github.com/OIKYO/pramaan/issues`). There is no support email or phone number yet: write `[NEED: contact email]` if one is needed.
- The demo organisation, **Northfield Academy**, and everyone in it are fictional.

### Things Pramaan does NOT do (don't claim them)

- It doesn't approve posters, and it isn't legal advice: passing every check doesn't guarantee a poster is lawful.
- It doesn't recognise faces.
- It doesn't send emails or messages; invite links are copied and shared by people.
- It doesn't design or edit posters, and it doesn't publish them.
- It has no certifications (ISO, SOC 2 and so on), no uptime guarantee, no SSO, and no paid support.
- It doesn't yet check PDF brochures or multi-image posts, or the size of small print. (These are planned: a digital consent link, larger reliability testing, and more formats.)

---

## Part 3. How it should sound

- **Plain and specific.** Say what happens: "Pramaan marks the wrong rank on the poster and tells you the right one." Not "Supercharge your brand compliance with AI."
- **Calm and exact**, like a careful colleague. Short sentences. Active voice.
- **Indian English spelling:** organisation, colour, licence (noun), centre.
- **Sentence case** for every heading and button ("Create organisation", not "Create Organisation"). No ALL CAPS.
- **No** exclamation marks, emoji, or hype words: seamless, supercharge, unlock, revolutionise, game-changing, cutting-edge, next-generation, magic, effortless, empower, leverage, robust, AI-powered (say what the AI does instead).
- **No** made-up numbers, customer names, testimonials, logos, awards or statistics.
- Buttons say exactly what they do: "Create organisation", "Sign in", "Read the privacy policy".
- Address the reader as "you"; Pramaan is "Pramaan" or "we" (the team).

---

## Part 4. The text needed

Each section has an ID, where it appears, length limits, and what it says today (rewrite or keep as you see fit).

### P1. Product menu (top bar dropdown, 4 entries)

For each entry: **title** (1–3 words) and **line** (at most 8 words). Each points to part of the product page.
Today: How it works · "Upload, read, check, review, approve" / The checks · "27 checks, in rulebooks you choose" / Rulebooks · "Set up for your industry, changed any time" / Reviews · "Branch, region, then head office".

### P2. Enterprise menu (top bar dropdown, 4 entries)

Same format as P1. Today: Many branches · "Each branch sees only its own posters" / Two-step approval · "Regional review, then head office" / Import your data · "Branches, prices, people and team from CSV" / Audit trail · "Every decision and AI call is logged". You may swap in: invite links and join codes; organisations kept apart; rulebooks per industry.

### P3. Pricing card (opens from "Pricing" in the top bar)

**Title** (at most 8 words), **body** (at most 30 words), **button label** (2–3 words). Today: "Free while Pramaan is in its pilot" / "Every rulebook and every check, for as many branches as you have. No card needed." / "Create organisation".

### P4. Hero (top of the home page)

**Headline** (at most 10 words), **subheading** (at most 40 words), **two button labels**. Today: "Check every branch poster before it goes out" / "Pramaan reads each poster your branches make, checks it against head office's rulebooks, and marks every problem with the fix. Your reviewers approve it. The AI never does." / "Create organisation", "See how it works".

### P5. Four-cell strip (under the example)

Four cells, each **title** (at most 4 words) and **text** (at most 25 words). Today: Reads every poster / Checks it in code / Marks the fix / People approve.

### P6. "Why Pramaan?"

**Section heading** (at most 4 words), **intro** (at most 20 words), and **three reasons**, each a **title** (at most 6 words) and **text** (at most 45 words). Today's reasons: Make your own brand rulebook / Consent before publicity / Two readers for every number.

### P7. "Built for many branches"

**Heading** (at most 5 words), **intro** (at most 40 words), and **two captions** (at most 35 words each): one for branch staff, one for regional managers and head office.

### P8. "Start for free"

**Heading** (at most 5 words), **text** (at most 40 words), **button label**; and the card beside it: **"Brand kit"** text (at most 25 words), **"Import your data securely"** text (at most 25 words), **"Add your team your way"** text (at most 25 words; mention invite links and the join code).

### P9. Product page (a new page, `/product`)

A full page about what Pramaan does. Suggested structure (change it if you have a better one):
1. Headline and short intro.
2. How a poster goes through Pramaan (the 8 steps in Part 2, written for a reader).
3. The rulebooks: what "always on", "when a poster shows it" and "for particular industries" mean, and each rulebook in one or two sentences.
4. Reading you can trust: two readers for numbers, the AI only reads and flags, code decides, people approve.
5. Built for your industry: the industry picker and the organisation's own words.
6. A closing line and button.
Length: 600–1,000 words.

### P10. Enterprise page (a new page, `/enterprise`)

For organisations with many branches. Suggested structure:
1. Headline and intro.
2. Roles and the two-step review.
3. Bringing people in: invite links, join codes, temporary passwords; removing access.
4. Your data: CSV imports, exports, organisations kept apart, consent files, the audit log.
5. Privacy and security, in plain words (only the facts in Part 2).
6. What's coming (the three planned improvements) and how to get in touch.
Length: 600–1,000 words.

### P11. Privacy policy (`/legal/privacy`)

A complete privacy policy in plain words, using only the facts in Part 2: who we are; what we collect (account, organisation data, posters, findings, audit log, consent files); why; where it's stored and processed (Supabase, Render, Vercel, Google Gemini, Groq, Google Fonts); what goes to AI and what never does; who can see what; how long data is kept `[NEED: retention period]`; how to remove data; children's data (consent signed by a guardian for minors); changes to the policy; contact. Mark anything you can't confirm with `[NEED: …]`. Include a "last changed" date.

### P12. Terms (`/legal/terms`)

Plain terms for a free pilot: what Pramaan is; it helps reviewers but isn't legal advice; the organisation decides what to publish; acceptable use (upload only what you have the right to; get consent before adding people; no real personal data during the pilot); accounts and passwords (the organisation password can't be recovered); availability (pilot, may change or stop, no guarantee); ending access; changes to the terms; contact.

### P13. Cookies (`/legal/cookies`)

What Pramaan keeps in the browser (sign-in session, theme, animation choice, whether the cookie notice was dismissed), that there is no tracking or advertising, and that fonts load from Google Fonts. Also a **short notice** for the cookie popup: at most 25 words, plus two button labels (one to dismiss, one to read more). Today: "Pramaan keeps only what it needs in your browser: your sign-in and your theme. No tracking, no ads." / "Got it", "What we keep".

### P14. Footer

Four column headings and their links: Product, Company, Contact, Legal. Plus a one-line footer note (at most 15 words). Today: "© 2026 Pramaan. Built for CodeNexus India 2026."

---

## Part 5. How to send the text back

Reply with one Markdown block. Use the IDs from Part 4 as headings, and `field: text` lines, so each piece can be pasted into the right place. For example:

```
## P3 Pricing card
title: Free while Pramaan is in its pilot
body: Every rulebook and every check, for as many branches as you have. No card needed.
button: Create organisation

## P5 Four-cell strip
1 title: Reads every poster
1 text: …
2 title: …
```

For the long pages (P9 to P13), write them in Markdown under their heading, using `###` for their own sections. Put every `[NEED: …]` note where the missing fact goes.
