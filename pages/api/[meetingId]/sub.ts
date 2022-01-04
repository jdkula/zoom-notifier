import { NextApiHandler } from 'next';
import sendIfttt from '~/lib/ifttt';
import { collections, Subscription } from '~/lib/mongo';
import { phoneToEmail } from '~/lib/phone';
import { sendEmail } from '~/lib/sendEmail';
import { sendText } from '~/lib/sendText';

async function delSub({
    phone,
    email,
    carrier,
    meetingId,
    ifttt,
}: Pick<Subscription, 'phone' | 'email' | 'carrier' | 'meetingId' | 'ifttt'>): Promise<boolean> {
    const db = await collections;

    const deleted = (await db.subscriptions.deleteOne({ phone, email, carrier, meetingId })).deletedCount > 0;

    const settings = await db.settings.findOne({ meetingId });

    const name = settings?.name || meetingId;

    if (deleted) {
        if (email) {
            await sendEmail(email, `Unsubscribed from zoom notifications for ${name}`, 'Zoom Notifier notification');
        } else if (ifttt) {
            await sendIfttt(ifttt, 'Zoom Notifier notification', `Unsubscribed from zoom notifications for ${name}`);
        } else {
            await sendText(phone, `Unsubscribed from zoom notifications for ${name}`);
        }
    }

    return deleted;
}

async function getSub({
    phone,
    email,
    meetingId,
    ifttt,
}: Pick<Subscription, 'phone' | 'email' | 'carrier' | 'meetingId' | 'ifttt'>) {
    const db = await collections;

    return await db.subscriptions.findOne({ phone, email, meetingId, ifttt }, { projection: { _id: 0 } });
}

async function addSub(s: Subscription) {
    const db = await collections;

    const { upsertedCount } = await db.subscriptions.updateOne(
        { email: s.email, phone: s.phone, ifttt: s.ifttt, meetingId: s.meetingId },
        { $set: s },
        { upsert: true },
    );

    const settings = await db.settings.findOne({ meetingId: s.meetingId });

    const name = settings?.name || s.meetingId;

    const contactEmail = s.email ? s.email : phoneToEmail(s.phone, s.carrier);

    if (upsertedCount) {
        if (s.email) {
            await sendEmail(
                contactEmail,
                `Subscribed to zoom notifications for ${name}!`,
                s.phone ? undefined : 'Zoom Notifier notification',
            );
        } else if (s.ifttt) {
            sendIfttt(s.ifttt, 'Subscription confirmation', `Subscribed to zoom notifications for ${name}!`);
        } else {
            await sendText(s.phone, `Subscribed to zoom notifications for ${name}!`);
        }
    } else {
        if (s.email) {
            await sendEmail(
                contactEmail,
                `Updated your notification information for ${name}!`,
                s.phone ? undefined : 'Zoom Notifier notification',
            );
        } else if (s.ifttt) {
            sendIfttt(s.ifttt, 'Subscription Update', `Updated your notification information for ${name}!`);
        } else {
            await sendText(s.phone, `Updated your notification information for ${name}!`);
        }
    }
}

const Sub: NextApiHandler = async (req, res) => {
    const { meetingId } = req.query as Record<string, string>;

    if (req.query.phone === 'null') req.query.phone = null;
    if (req.query.email === 'null') req.query.email = null;
    if (req.query.ifttt === 'null') req.query.ifttt = null;

    const record = {
        meetingId,
        phone: req.body.phone || null,
        carrier: req.body.carrier || null,
        email: req.body.email || null,
        ifttt: req.body.ifttt || null,
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
            ifttt: (req.query.ifttt as string | undefined) || null,
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
