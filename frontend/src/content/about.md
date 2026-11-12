# About Pramaan

Pramaan checks every poster a multi-branch organisation's branches make, before it is published. *Pramaan* (प्रमाण) is Hindi for proof.

## The pilot

Pramaan is a pilot, built for CodeNexus India 2026 in response to the Brand Governance problem statement set by Inkloom AI. It is free while it is a pilot, and it is not yet run by a registered company.

The pilot shows the whole journey of a poster: a branch uploads it, Pramaan reads and checks it against head office's rulebooks, and the poster goes through regional review to head office's final approval. Any organisation can sign up and try it. Its demo organisation, Northfield Academy, and everyone in it are fictional.

Three improvements are planned next: a digital consent link, larger reliability testing, and more formats beyond poster images.

## The team

Pramaan is built by team HEISEN-DE-BUG: Oikyo Chowdhury, Rishav Nandi, Rudrapriyo Chatterjee and Zihan Sirat. What each of us did is recorded in the project's [contributions](https://github.com/OIKYO/pramaan/blob/main/docs/contributions.md), and every part written with AI help is listed in its [AI disclosure](https://github.com/OIKYO/pramaan/blob/main/docs/ai-disclosure.md).

## How it's built

Pramaan's code is open on [GitHub](https://github.com/OIKYO/pramaan). The website is React; the checking service is Python with FastAPI; the database, file storage and sign-in are Supabase. Google's Gemini reads posters, with a backup on Groq, and Tesseract reads key numbers a second time. Every decision about a rule is made in plain code, and every approval is made by a person.

## Contact

For questions or issues, use the [GitHub issues page](https://github.com/OIKYO/pramaan/issues).

[Create organisation](/signup?new)
