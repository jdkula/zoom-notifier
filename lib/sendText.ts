import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const twilioNumber = process.env.TWILIO_PHONE;

const client = new Twilio(accountSid, authToken);

export async function sendText(to: string, text: string): Promise<MessageInstance> {
    console.log('Sending', to, '-', text);
    return await client.messages.create({
        from: twilioNumber,
        to,
        body: text,
    });
}
