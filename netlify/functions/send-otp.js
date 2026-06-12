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
      fromEmail: requestFromEmail,
      fromName: requestFromName
    } = JSON.parse(event.body || '{}');

    if (!email || !otpCode) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or otpCode' }) };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Resend API key is not configured' })
      };
    }

    const FROM_EMAIL = requestFromEmail || process.env.FROM_EMAIL;
    const FROM_NAME = requestFromName || process.env.FROM_NAME || 'LiquiFi';
    if (!FROM_EMAIL) {
      return { statusCode: 500, body: JSON.stringify({ error: 'FROM_EMAIL is not configured' }) };
    }

    const mailSubject = subject || 'Your LiquiFi OTP Code';
    const mailBody = message || `Your LiquiFi OTP is: ${otpCode}\n\nThis OTP expires in ${expiryMinutes} minutes. Do not share it with anyone.`;

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
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
