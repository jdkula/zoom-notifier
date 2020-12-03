import mailgun, { messages } from 'mailgun-js';

const mg = mailgun({ apiKey: process.env.MAILGUN_API, domain: process.env.MAILGUN_DOMAIN });

export async function sendEmail(to: string, text: string, subject?: string): Promise<messages.SendResponse> {
    console.log('Sending', to, '-', text);
    return await mg.messages().send({
        from: process.env.MAILGUN_FROM,
        to,
        text,
        subject,
    });
}
