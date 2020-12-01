import { NextApiHandler } from 'next';
import { collections } from '~/lib/mongo';
import { sendEmail } from '~/lib/sendEmail';

const Unsub: NextApiHandler = async (req, res) => {
    const { email, meetingId } = req.query as Record<string, string>;
    const db = await collections;

    if (!email) {
        res.status(400).end('Email not found');
        return;
    }

    const settings = await db.settings.findOne({ meetingId });

    const name = settings?.name ?? meetingId;

    if (req.method === 'DELETE') {
        await db.subscriptions.deleteOne({ email, meetingId });

        await sendEmail(email as string, `Subscription for ${name} successfully removed!`, 'Zoom Notifier');

        res.send('OK');
    } else {
        const subscription = await db.subscriptions.findOne({ email, meetingId }, { projection: { _id: 0 } });

        if (!subscription) {
            res.status(404).end('Not Found');
        } else {
            res.status(200).send(subscription);
        }
    }
};

export default Unsub;
