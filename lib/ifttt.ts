import Axios from 'axios';

export default async function sendIfttt(key: string, title: string, message: string, link?: string): Promise<void> {
    console.log(`Sending IFTTT message with key ${key}: ${message}`);
    await Axios.post(`https://maker.ifttt.com/trigger/zoom_notification/with/key/${key}`, {
        value1: title,
        value2: message,
        ...(link && { value3: link }),
    });
}
