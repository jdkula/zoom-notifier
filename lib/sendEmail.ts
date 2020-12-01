import mailgun from 'mailgun-js';

const mg = mailgun({ apiKey: process.env.MAILGUN_API, domain: process.env.MAILGUN_DOMAIN });

export async function sendEmail(to: string, text: string, subject?: string): Promise<void> {
    console.log('Sending', to, '-', text);
    await mg.messages().send({
        from: process.env.MAILGUN_FROM,
        to,
        text,
        subject,
    });
}
