import { NextApiHandler } from 'next';
import { collections, Setting } from '~/lib/mongo';

export const getSettings = async (meetingId: string, defaultName?: string, defaultUrl?: string): Promise<Setting> =>
    (
        await (
            await collections
        ).settings.findOneAndUpdate(
            { meetingId },
            {
                $setOnInsert: {
                    name: defaultName ?? meetingId,
                    url: defaultUrl ?? `https://zoom.us/j/${meetingId}`,
                },
            },
            { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
        )
    ).value;

const Settings: NextApiHandler = async (req, res) => {
    const { meetingId } = req.query as Record<string, string>;
    const db = await collections;

    if (req.method === 'GET') {
        res.send(await getSettings(meetingId as string));
    } else if (req.method === 'PUT') {
        const record: Setting = {
            meetingId: meetingId,
            name: req.body.name,
            url: req.body.url,
            seriousMessagesOnly: req.body.seriousMessagesOnly,
            shorten: req.body.shorten,
            lastEventTime: 0,
        };
        await db.settings.updateOne({ meetingId }, { $set: record }, { upsert: true });
        res.send(record);
    } else {
        res.status(400).end();
    }
};

export default Settings;
