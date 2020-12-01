import { NextApiHandler } from 'next';
import mongo from '~/lib/mongo';
import { sendEmail } from '~/lib/sendEmail';

const Unsub: NextApiHandler = async (req, res) => {
    const { email, meetingId } = req.query;
    const db = await mongo;

    if (!email) {
        res.status(400).end('Email not found');
        return;
    }

    const settings = await db
        .collection<{ for: string; name: string; url: string }>('settings')
        .findOne({ for: meetingId as string });

    const name = settings?.name ?? meetingId;

    if (req.method === 'DELETE') {
        await db.collection('subscriptions').deleteOne({ email: email, for: meetingId });

        await sendEmail(email as string, `Subscription for ${name} successfully removed!`, 'Zoom Notifier');

        res.send('OK');
    } else {
        const hasOne = await db.collection('subscriptions').findOne({ email: email, for: meetingId });

        if (!hasOne) {
            res.status(404).end('Not Found');
        } else {
            res.status(200).end('Found');
        }
    }
};

export default Unsub;
