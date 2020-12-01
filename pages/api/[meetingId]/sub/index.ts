import { NextApiHandler } from 'next';
import mongo from '~/lib/mongo';
import { sendEmail } from '~/lib/sendEmail';
import Subscription from '~/lib/subscription';

const Sub: NextApiHandler<Subscription> = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(400).end();
        return;
    }
    const { meetingId } = req.query;

    const record = {
        for: meetingId,
        ...req.body,
    };
    const db = await mongo;
    const { upsertedCount } = await db
        .collection('subscriptions')
        .updateOne({ email: record.email, for: meetingId }, { $set: record }, { upsert: true });

    const settings = await db
        .collection<{ for: string; name: string; url: string }>('settings')
        .findOne({ for: meetingId as string });

    const name = settings?.name || meetingId;

    if (upsertedCount) {
        await sendEmail(
            req.body.email,
            `Subscribed to zoom notifications for ${name}!`,
            req.body.phone ? undefined : 'Zoom Notifier notification',
        );
    } else {
        await sendEmail(
            req.body.email,
            `Updated your notification information for ${name}!`,
            req.body.phone ? undefined : 'Zoom Notifier notification',
        );
    }

    res.send(record);
};

export default Sub;
