import { NextApiHandler } from 'next';
import { collections, Subscription } from '~/lib/mongo';
import { sendEmail } from '~/lib/sendEmail';

const Sub: NextApiHandler<Subscription> = async (req, res) => {
    const db = await collections;

    if (req.method !== 'POST') {
        res.status(400).end();
        return;
    }
    const { meetingId } = req.query as Record<string, string>;

    const record = {
        ...req.body,
        meetingId,
    };

    const { upsertedCount } = await db.subscriptions.updateOne(
        { email: record.email, meetingId },
        { $set: record },
        { upsert: true },
    );

    const settings = await db.settings.findOne({ meetingId });

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
