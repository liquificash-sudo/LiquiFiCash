exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const {
      email,
      otpCode,
      expiryMinutes,
      subject,
      message,
      service,
      apiKey,
      apiSecret,
      fromEmail: requestFromEmail,
      fromName: requestFromName
    } = JSON.parse(event.body || '{}');

    if (!email || !otpCode) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or otpCode' }) };
    }

    const FROM_EMAIL = requestFromEmail || process.env.FROM_EMAIL;
    const FROM_NAME = requestFromName || process.env.FROM_NAME || 'LiquiFi';
    if (!FROM_EMAIL) {
      return { statusCode: 500, body: JSON.stringify({ error: 'FROM_EMAIL is not configured' }) };
    }

    const mailSubject = subject || 'Your LiquiFi OTP Code';
    const mailBody = message || `Your LiquiFi OTP is: ${otpCode}\n\nThis OTP expires in ${expiryMinutes} minutes. Do not share it with anyone.`;

    const selectedService = (service || process.env.MAIL_SERVICE || '').toLowerCase();
    const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
    const hasMailjet = Boolean(process.env.MAILJET_API_KEY && process.env.MAILJET_API_SECRET);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasRequestMailjet = Boolean(apiKey && apiSecret);
    const hasRequestResend = Boolean(apiKey && !apiSecret && selectedService === 'resend');
    const hasRequestSendGrid = Boolean(apiKey && !apiSecret && selectedService !== 'resend');

    let effectiveService = selectedService;
    if (!effectiveService) {
      if (hasResend) {
        effectiveService = 'resend';
      } else if (hasRequestMailjet || hasMailjet) {
        effectiveService = 'mailjet';
      } else if (hasRequestSendGrid || hasSendGrid) {
        effectiveService = 'sendgrid';
      }
    }

    if (effectiveService === 'sendgrid') {
      const SENDGRID_API_KEY = hasRequestSendGrid ? apiKey : process.env.SENDGRID_API_KEY;
      if (!SENDGRID_API_KEY) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'SendGrid API key is not configured' })
        };
      }

      const sendgridPayload = {
        personalizations: [{
          to: [{ email }],
          subject: mailSubject
        }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        content: [{ type: 'text/plain', value: mailBody }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendgridPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, service: 'sendgrid' }) };
    }

    if (effectiveService === 'mailjet') {
      const MAILJET_API_KEY = apiKey || process.env.MAILJET_API_KEY;
      const MAILJET_API_SECRET = apiSecret || process.env.MAILJET_API_SECRET;

      if (!MAILJET_API_KEY || !MAILJET_API_SECRET) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Mailjet API key or secret is not configured' })
        };
      }

      const payload = {
        Messages: [
          {
            From: { Email: FROM_EMAIL, Name: FROM_NAME },
            To: [{ Email: email }],
            Subject: mailSubject,
            TextPart: mailBody
          }
        ]
      };

      const authHeader = `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString('base64')}`;
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, service: 'mailjet' }) };
    }

    if (effectiveService === 'resend') {
      const RESEND_API_KEY = apiKey || process.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Resend API key is not configured' })
        };
      }

      const payload = {
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject: mailSubject,
        text: mailBody,
        html: mailBody.replace(/\n/g, '<br/>')
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, service: 'resend' }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported mail service' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
