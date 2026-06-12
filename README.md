# LiquiFiCash

This project uses Netlify for static hosting and a Netlify Function to send OTP emails via Resend.

## Setup

1. Create a Resend account at https://resend.com
2. Verify the sender email or domain with Resend.
3. Set these Netlify environment variables:
   - `FROM_EMAIL` — your verified sender email
   - `FROM_NAME` (optional, defaults to `LiquiFi`)
   - `RESEND_API_KEY` — your Resend API key

## Netlify Deployment

1. Push this repository to GitHub.
2. Connect the repo in Netlify.
3. Netlify will automatically detect the `netlify.toml` file.
4. Set the environment variables in Netlify dashboard (Settings → Build & Deploy → Environment).
5. Deploy the site.

> Note: Netlify Functions do not run in GitHub.dev preview or other static preview environments. To test the OTP email flow, deploy the site to Netlify or run it locally with `netlify dev`.

## Email OTP flow

- The front-end calls `/api/send-otp`.
- The Netlify function `netlify/functions/send-otp.js` sends email via Resend.
- OTP sessions are stored in Supabase and verified on the client.
