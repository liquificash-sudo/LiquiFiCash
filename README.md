# LiquiFiCash

This project uses Netlify for static hosting and a Netlify Function to send OTP emails via SendGrid.

## Setup

1. Create a SendGrid account.
2. Verify the sender email `liquificash@gmail.com` in SendGrid.
3. Set these Netlify environment variables:
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`

## Netlify Deployment

1. Push this repository to GitHub.
2. Connect the repo in Netlify.
3. Netlify will automatically detect the `netlify.toml` file.
4. Deploy the site.

> Note: Netlify Functions do not run in GitHub.dev preview or other static preview environments. To test the OTP email flow, deploy the site to Netlify or run it locally with `netlify dev`.

## Email OTP flow

- The front-end calls `/api/send-otp`.
- The Netlify function `netlify/functions/send-otp.js` sends email via SendGrid.
- OTP sessions are stored in Supabase and verified on the client.
