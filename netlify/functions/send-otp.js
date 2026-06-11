exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { email, otpCode, expiryMinutes, subject, message } = JSON.parse(event.body || '{}');
    if (!email || !otpCode) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or otpCode' }) };
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL;
    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
    }

    const mailSubject = subject || 'Your LiquiFi OTP Code';
    const mailBody = message || `Your LiquiFi OTP is: ${otpCode}\n\nThis OTP expires in ${expiryMinutes} minutes. Do not share it with anyone.`;

    const payload = {
      personalizations: [{
        to: [{ email }],
        subject: mailSubject
      }],
      from: { email: FROM_EMAIL, name: 'LiquiFi' },
      content: [{
        type: 'text/plain',
        value: mailBody
      }]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
