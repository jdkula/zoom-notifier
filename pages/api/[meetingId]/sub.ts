import { NextApiHandler } from 'next';
import { collections, Subscription } from '~/lib/mongo';
import { phoneToEmail } from '~/lib/phone';
import { sendEmail } from '~/lib/sendEmail';

async function delSub({
    phone,
    email,
    carrier,
    meetingId,
}: Pick<Subscription, 'phone' | 'email' | 'carrier' | 'meetingId'>) {
    const db = await collections;

    return (await db.subscriptions.deleteOne({ phone, email, carrier, meetingId })).deletedCount > 0;
}

async function getSub({
    phone,
    email,
    carrier,
    meetingId,
}: Pick<Subscription, 'phone' | 'email' | 'carrier' | 'meetingId'>) {
    const db = await collections;

    return await db.subscriptions.findOne({ phone, email, carrier, meetingId }, { projection: { _id: 0 } });
}

async function addSub(s: Subscription) {
    const db = await collections;

    const { upsertedCount } = await db.subscriptions.updateOne(
        { email: s.email, meetingId: s.meetingId },
        { $set: s },
        { upsert: true },
    );

    const settings = await db.settings.findOne({ meetingId: s.meetingId });

    const name = settings?.name || s.meetingId;

    const contactEmail = s.email ? s.email : phoneToEmail(s.phone, s.carrier);

    if (upsertedCount) {
        await sendEmail(
            contactEmail,
            `Subscribed to zoom notifications for ${name}!`,
            s.phone ? undefined : 'Zoom Notifier notification',
        );
    } else {
        await sendEmail(
            contactEmail,
            `Updated your notification information for ${name}!`,
            s.phone ? undefined : 'Zoom Notifier notification',
        );
    }
}

const Sub: NextApiHandler = async (req, res) => {
    const { meetingId } = req.query as Record<string, string>;

    const record = {
        meetingId,
        phone: req.body.phone,
        carrier: req.body.carrier,
        email: req.body.email,
        join: req.body.join,
        leave: req.body.leave,
        end: req.body.end || req.body.leave,
        start: req.body.start || req.body.join,
    };

    if (req.method === 'POST') {
        await addSub(record);
        res.send(record);
    } else if (req.method === 'GET') {
        const sub = await getSub({
            meetingId,
            phone: (req.query.phone as string | undefined) || null,
            carrier: (req.query.carrier as Subscription['carrier'] | undefined) || null,
            email: (req.query.email as string | undefined) || null,
        });
        if (!sub) {
            res.status(404).send('Not found.');
        } else {
            res.send(sub);
        }
    } else if (req.method === 'DELETE') {
        const deleted = await delSub(record);
        res.send(deleted ? 'Done' : 'Nothing to do.');
    }
};

export default Sub;
