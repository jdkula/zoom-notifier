import { NextApiHandler } from 'next';
import mongo from '~/lib/mongo';
import { sendEmail } from '~/lib/sendEmail';
import Subscription from '~/lib/subscription';

export type Setting = { name: string; url: string };

export const getSettings = async (meetingId: string, defaultName?: string, defaultUrl?: string): Promise<Setting> =>
    (
        await (await mongo).collection('settings').findOneAndUpdate(
            { for: meetingId },
            {
                $setOnInsert: {
                    name: defaultName ?? meetingId,
                    url: defaultUrl ?? `https://zoom.us/j/${meetingId}`,
                },
            },
            { upsert: true, returnOriginal: false, projection: { _id: 0, name: 1, url: 1 } },
        )
    ).value;

const Settings: NextApiHandler = async (req, res) => {
    const { meetingId } = req.query;
    const db = (await mongo).collection('settings');

    if (req.method === 'GET') {
        res.send(await getSettings(meetingId as string));
    } else if (req.method === 'PUT') {
        const record = {
            for: meetingId,
            ...req.body,
        };
        await db.updateOne({ for: meetingId }, { $set: record }, { upsert: true });
        res.send(record);
    } else {
        res.status(400).end();
    }
};

export default Settings;
