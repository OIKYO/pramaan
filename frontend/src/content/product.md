# Every poster checked against your rules

Pramaan checks the posters made by your branches before they are published. It reads each poster, compares its content with the records and rulebooks approved by head office, and marks problems where they appear. Each finding tells your team which rule was broken, why it matters and exactly what to fix.

Your branches make the posters. Your reviewers make the decisions. The AI never approves anything.

## How a poster goes through Pramaan

**1. Upload the poster**

Branch staff upload a poster image, its caption and alt text. They choose where it will be published: print, Instagram or WhatsApp. They also tag anyone shown on it so Pramaan can check the organisation's consent register.

**2. Read the poster**

Google's Gemini reads the poster once. It identifies its text, prices, phone numbers, ranks, people and claims, including text in Hindi and Bengali. If Gemini is busy, a backup model on Groq reads it instead. Pramaan reuses that reading rather than sending the same image to the AI twice.

**3. Read important numbers again**

A second reader, Tesseract, independently reads every price, rank, phone number and figure. If the two readers disagree, Pramaan asks a person to confirm the number. It does not guess.

**4. Run the checks**

Up to 27 checks run in plain code against the organisation's active rulebooks. Two of them use AI judgement to assess tone of voice and disguised guarantees such as "selection pakka". These can warn your team, but cannot block a poster.

**5. Show every finding**

Problems are boxed and numbered on the poster. Each finding identifies the rule it breaks, explains why the rule exists and gives an exact fix, such as "Change the rank to AIR 73". Checks that passed are listed too, so your team can see what was checked.

**6. Fix and resubmit**

Branch staff correct the poster and upload the fixed version. Pramaan checks it again. Your team can compare versions side by side.

**7. Review and approve**

The regional manager reviews the poster and either approves it or sends it back with a comment. Head office then gives final approval. Nobody can approve a poster they made. Approval is refused while a blocking problem remains open. Only head office can override a block, and it must give a written reason.

**8. Keep a record**

Every step is recorded in the audit log, including status changes, reviews, overrides and AI calls. The log records which model was used, which image was read and when.

## Rulebooks that fit your organisation

Head office maintains the records and checks that posters are measured against. Your organisation's industry and type determine the starting rulebook selection. Head office can choose its rulebooks and manage the approved records within them.

There are three kinds of rulebooks.

### Always on

These contain fundamental checks that apply to every poster. They cannot be switched off.

**Brand kit:** Holds the organisation's registered name, logo, colour palette, helpline and tone of voice. Pramaan checks that the logo, required name and helpline are present, colours follow the palette, text contrast meets the WCAG minimum (4.5:1, or 3:1 for large text), and required alt text is provided for Instagram and WhatsApp. The AI can warn about tone of voice.

**Branch contact details:** Checks that the phone numbers and addresses shown belong to the relevant branch or use the organisation's helpline.

**Honest claims:** Blocks promised results such as "100% selection" and "guaranteed job" in English, Hindi and Bengali. AI also flags disguised guarantees, but those warnings do not block publication.

**People and consent:** Checks that everyone shown is in the organisation's register and has signed consent for the relevant channel. Consent must be in date. A guardian must sign for a minor, and consent for results must be given after the result. Staff tag the people shown; Pramaan does not recognise faces.

**Copyright and asset permissions:** Checks for stock-photo watermarks and whether another organisation's name or logo has been listed by head office as an approved partner.

### When a poster shows it

These rulebooks run when the relevant information appears on a poster.

**Offerings and prices:** Checks that named courses, products or services and their prices match head office's approved records, and that the approval has not expired. The name adapts to the organisation: a coaching institute sees "Courses and fees", while a restaurant sees "Menu and prices".

**Approved figures:** Checks that statistics quoted on posters match figures approved by head office.

**Dates, deadlines and availability:** Checks that dates exist, match their stated weekdays and have not passed.

**Offers, discounts and terms:** Checks that an offer states how long it lasts, points to its conditions, and uses percentages and savings that add up correctly.

**Legal and regulatory compliance:** Checks for disclaimers that head office requires on every poster and blocks claims that the organisation's industry must not make, such as "guaranteed returns" in finance or "100% cure" in healthcare.

### For particular industries

Some checks apply to specific industries and organisation types.

**Exam results (coaching ads):** For coaching institutes in India, ranks must match the organisation's register. Every topper shown must have their course, course duration and paid or free status stated beside them, following the CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024.

## Two readers, clear decisions

Pramaan separates reading, checking and approval.

AI reads the poster and can help flag wording. Tesseract independently reads key numbers. Plain code decides whether the approved records and rules are met. People review the findings and make approval decisions.

This means the AI does not approve posters, and an AI warning about wording is never treated as a blocking decision.

## Built around your industry

When you create an organisation, you choose its industry and kind of organisation from the available options, or enter your own. This determines the starting rulebook selection and helps Pramaan use the terminology your team knows.

A coaching institute sees "Courses and fees" and "Toppers register". A restaurant sees "Menu and prices". A sports club sees "Memberships and fees" and "Players and consent". An NGO sees "Impact figures".

The rules remain tied to the records your head office approves.

## Check before you publish

Give every branch a clear way to check its posters and give every reviewer a record of what happened.

[Create organisation](/signup)
