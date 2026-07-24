import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { google } from 'googleapis';

const router = express.Router();

router.post('/send-report', verifyToken, async (req, res) => {
  const { to, subject, message, pdfBase64, filename, googleAccessToken } = req.body;
  
  if (!googleAccessToken) {
    return res.status(401).json({ error: 'Missing Google Access Token. Please sign in with Google.' });
  }
  
  if (!to || !subject || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields for sending email.' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccessToken });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Construct the raw email message with attachment using RFC 2822 formatting
    const boundary = 'supervisor-eye-boundary-12345';
    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message || 'Please find the attached report from Supervisor Eye.',
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${filename || 'report.pdf'}"`,
      `Content-Disposition: attachment; filename="${filename || 'report.pdf'}"`,
      'Content-Transfer-Encoding: base64',
      '',
      pdfBase64,
      '',
      `--${boundary}--`
    ].join('\n');
    
    // The message needs to be base64url encoded
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error sending email via Gmail API:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

export default router;
