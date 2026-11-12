# Keep every branch within the same rules

When an organisation has many branches, its posters are made by many different people. Pramaan gives those teams one set of approved records and a review process that runs from the branch to the region and finally to head office.

Branches keep making their own posters. Head office keeps control of the rulebooks, and every review and decision is recorded.

## Three roles, one review process

Pramaan has three roles inside an organisation.

**Branch staff**

Branch staff make posters for their own branch and upload them for checking. They see the findings, make corrections and resubmit. They can see the posters belonging to their branch, not those of other branches.

**Regional managers**

Regional managers review posters submitted by branches in their region. They can approve a poster at the regional stage or send it back with a comment explaining what needs attention.

**Head office**

Head office manages the organisation's rulebooks, branches, people and approved records. It reviews posters after the regional stage and gives final approval.

The review process has two stages: regional review followed by head office approval. Nobody can approve a poster they made. A poster cannot receive approval while a blocking problem is open. Only head office can override a block, and it must provide a written reason.

## Bring your team in

There are three ways to add people to your organisation.

**Invite links**

Head office can invite anyone. Regional managers can invite branch staff for branches within their region. Each invite link is meant for one person, works once and expires after seven days. Pramaan stores only a scrambled, hashed form of the link.

**Organisation join code**

Every organisation has a join code, such as `K7MQ-X3VP`, visible only inside that organisation. A person can enter the code while creating an account and join as branch staff of the branch they select. If the code leaks, head office can replace it at any time.

**Add people from head office**

Head office can add a team member directly with a temporary password. That person must change the password the first time they sign in.

When someone leaves the organisation or no longer needs access, head office can remove their access immediately. Their history remains in the audit log.

## Set up your organisation

Anyone can create an organisation from the website. During setup, they choose its industry and kind of organisation, then become its head office. The password used for head office is called the organisation password. It cannot be recovered if forgotten.

A setup checklist guides head office through the initial records and configuration:

- Brand kit, including registered name, logo, colours and helpline.
- Branches and regional structure.
- Offerings and approved prices.
- People and their signed consent.
- Approved figures and statistics.
- Team members and their roles.

The organisation's industry and type determine the initial selection of rulebooks. Head office can then manage the organisation's approved records.

## Import your data from CSV

You can import branches, prices, figures, people and team members using CSV files exported from Excel or Google Sheets.

Pramaan checks every row before saving anything. If a row has a problem, it identifies the relevant line and column. Nothing is saved until the entire file is valid. This gives head office a chance to correct the file before its records are added.

Each rulebook page and the Team page can also export their records as a CSV file, in the same columns, so a file can be edited in a spreadsheet and imported back.

## Data kept within your organisation

Organisations are isolated at the database level. Every table carries the organisation it belongs to, and every access rule starts with the principle that people can access their own organisation's data only.

Within an organisation, access is also limited by role. Branch staff see their branch's posters. Regional managers see the posters in their region. Head office can access the organisation's information.

Consent files are stored privately. Only head office can open them, through links that expire after a few minutes.

Every status change, review, override, data import, invite and AI call is recorded in the audit log. This includes which AI model was used, which poster image it read and when.

Head office can delete the whole organisation from its profile page, which removes its records, posters, consent files and sign-ins at once. Anyone can delete their own account from Settings.

## Privacy and security

Pramaan uses Supabase for its hosted Postgres database and file storage, in Mumbai. The application runs on Vercel, and the poster-checking service runs on Render, in Singapore.

The AI receives only the poster image and its caption. The people register and consent files are never sent to an AI model.

During the pilot, Pramaan uses free AI tiers. Google may use free-tier inputs to improve its models. For this reason, the demo organisation is fictional, and organisations should not upload real personal data during the pilot.

Sign-in is handled by Supabase. Pramaan does not keep passwords itself; Supabase stores them in hashed form. Passwords must have at least eight characters, including a number and a special character.

The browser stores the sign-in session and the user's theme and animation choices. Pramaan does not use advertising or tracking cookies, and it does not use analytics. Fonts load from Google Fonts.

These are the current facts about how the pilot works. Pramaan does not claim an ISO or SOC 2 certification, a guaranteed uptime level or single sign-on.

## What's coming

Three improvements are planned:

- A digital consent link, to make the consent process easier.
- Larger reliability testing.
- Support for more formats, beyond the current poster-image workflow.

Pramaan currently checks poster images. It does not yet check PDF brochures, multi-image posts or the size of small print.

## Try the pilot

Pramaan is free during the pilot. It was built by team HEISEN-DE-BUG for CodeNexus India 2026.

For questions or issues, use the [Pramaan GitHub issues page](https://github.com/OIKYO/pramaan/issues).

[Create organisation](/signup?new)
