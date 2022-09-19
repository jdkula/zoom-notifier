import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { MessagesSendResult } from 'mailgun.js/interfaces/Messages';

const mg = new Mailgun(formData).client({
    username: 'api',
    key: process.env.MAILGUN_API,
});

export async function sendEmail(to: string, text: string, subject?: string): Promise<MessagesSendResult> {
    console.log('Sending', to, '-', text);
    return await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: process.env.MAILGUN_FROM,
        to,
        text,
        subject,
    });
}
