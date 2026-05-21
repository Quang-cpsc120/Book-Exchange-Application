const nodemailer = require('nodemailer');

const EMAIL_ENABLED = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = EMAIL_ENABLED
  ? nodemailer.createTransport({
      host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const FROM = process.env.EMAIL_FROM || `"Titus" <${process.env.EMAIL_USER}>`;

async function sendEmail({ to, subject, html }) {
  if (!EMAIL_ENABLED) {
    console.log(`📧  [email skipped — not configured] To: ${to} | ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧  Email sent → ${to}: ${subject}`);
  } catch (err) {
    console.warn(`⚠️  Email failed → ${to}: ${err.message}`);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function requestReceivedEmail({ ownerName, requesterName, bookTitle, offerBook, message }) {
  return {
    subject: `📬 New exchange request for "${bookTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#003DA5;margin-bottom:4px">New Exchange Request</h2>
        <p style="color:#5a6a8a;margin-top:0">Hi ${ownerName},</p>
        <p><strong>${requesterName}</strong> wants to exchange for your book:</p>
        <div style="background:#f0f4ff;border-left:4px solid #003DA5;padding:12px 16px;border-radius:4px;margin:16px 0">
          <strong style="font-size:16px">${bookTitle}</strong>
        </div>
        ${offerBook ? `<p><strong>They're offering:</strong> ${offerBook}</p>` : ''}
        ${message ? `<p><strong>Their message:</strong> "${message}"</p>` : ''}
        <p>Log in to <a href="http://localhost:3000/profile?tab=requests" style="color:#003DA5">your profile</a> to accept or decline.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Titus — Cal State Fullerton Book Exchange</p>
      </div>
    `,
  };
}

function requestAcceptedEmail({ requesterName, ownerName, bookTitle }) {
  return {
    subject: `✅ Your request for "${bookTitle}" was accepted!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#166534;margin-bottom:4px">Request Accepted 🎉</h2>
        <p style="color:#5a6a8a;margin-top:0">Hi ${requesterName},</p>
        <p>Great news! <strong>${ownerName}</strong> accepted your exchange request for:</p>
        <div style="background:#dcfce7;border-left:4px solid #166534;padding:12px 16px;border-radius:4px;margin:16px 0">
          <strong style="font-size:16px">${bookTitle}</strong>
        </div>
        <p>Head to <a href="http://localhost:3000/profile?tab=requests" style="color:#003DA5">your profile</a> to message them and coordinate the exchange.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Titus — Cal State Fullerton Book Exchange</p>
      </div>
    `,
  };
}

function requestDeclinedEmail({ requesterName, ownerName, bookTitle }) {
  return {
    subject: `Request for "${bookTitle}" was declined`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#b91c1c;margin-bottom:4px">Request Declined</h2>
        <p style="color:#5a6a8a;margin-top:0">Hi ${requesterName},</p>
        <p><strong>${ownerName}</strong> declined your exchange request for:</p>
        <div style="background:#fee2e2;border-left:4px solid #b91c1c;padding:12px 16px;border-radius:4px;margin:16px 0">
          <strong style="font-size:16px">${bookTitle}</strong>
        </div>
        <p>Don't give up — <a href="http://localhost:3000/browse" style="color:#003DA5">browse more books</a> to find another match!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Titus — Cal State Fullerton Book Exchange</p>
      </div>
    `,
  };
}

module.exports = { sendEmail, requestReceivedEmail, requestAcceptedEmail, requestDeclinedEmail };
