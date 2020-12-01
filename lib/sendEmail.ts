import { mg } from '../pages/api/hook';

export async function sendEmail(to: string, text: string, subject?: string) {
    console.log('Sending', to, '-', text);
    await mg.messages().send({
        from: process.env.MAILGUN_FROM,
        to,
        text,
        subject,
    });
}
