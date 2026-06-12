# LiquiFiCash

This project uses Netlify for static hosting and a Netlify Function to send OTP emails via Mailjet.

## Setup

1. Create a Mailjet, SendGrid, or Resend account.
2. Verify the sender email or domain with your email provider, if required.
3. Set these Netlify environment variables:
   - `FROM_EMAIL`
   - `FROM_NAME` (optional)

   For Mailjet:
   - `MAILJET_API_KEY`
   - `MAILJET_API_SECRET`

   For SendGrid:
   - `SENDGRID_API_KEY`
   - `MAIL_SERVICE=sendgrid` (optional when using SendGrid)

   For Resend:
   - `RESEND_API_KEY`
   - `MAIL_SERVICE=resend` (optional when using Resend)

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
