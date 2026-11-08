# Cookies and browser storage

**Last changed: 8 November 2026**

Pramaan keeps a small amount of information in your browser so the application can remember your sign-in and display preferences. It does this with your browser's local storage, not with cookies.

## What Pramaan keeps

- **Your sign-in session** (`sb-…-auth-token`, kept by Supabase). It lets you stay signed in. The part that proves who you are renews itself every hour while you use Pramaan, and the whole session is removed when you sign out.
- **Your selected theme** (`pramaan-theme`): light, midnight, or match your device. Kept until you change it.
- **Your animation preference** (`pramaan-reduce-motion`): set only if you ask for fewer animations in Settings.
- **Whether you have dismissed the cookie notice** (`pramaan-cookie-notice`).

These settings help Pramaan keep you signed in and remember how you prefer to use the application. You can remove them at any time by signing out and clearing this site's data in your browser.

## Tracking and advertising

Pramaan does not use advertising or tracking cookies. It does not use analytics, and no third party sets cookies through Pramaan.

## Fonts

Pramaan loads fonts from Google Fonts. This means your browser connects to Google's servers when loading the website's fonts, and Google receives your IP address as part of that request.
