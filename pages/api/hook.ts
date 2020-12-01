import { NextApiHandler } from 'next';
import mongo from '~/lib/mongo';
import Subscription from '~/lib/subscription';

import { sendEmail } from '../../lib/sendEmail';

const PARTICIPANT_JOINED = 'meeting.participant_joined';
const PARTICIPANT_LEFT = 'meeting.participant_left';

type Meeting = { _id: string; participants: string[] };

async function notify(event: string, id: string, name: string, uid: string) {
    const db = await mongo;

    let currentParticipants: number;
    if (event === PARTICIPANT_JOINED) {
        const meeting = await db
            .collection<Meeting>('meetings')
            .findOneAndUpdate(
                { _id: id },
                { $addToSet: { participants: uid } },
                { returnOriginal: true, upsert: true },
            );
        if ((meeting.value?.participants ?? []).includes(uid)) return; // duplicate notifiaction – already joined
        currentParticipants = (meeting.value?.participants?.length ?? 0) + 1; // account for new participant
    } else if (event === PARTICIPANT_LEFT) {
        const meeting = await db
            .collection<Meeting>('meetings')
            .findOneAndUpdate({ _id: id }, { $pull: { participants: uid } }, { returnOriginal: true, upsert: true });
        if (!(meeting.value?.participants ?? []).includes(uid)) return; // duplicate notification – already left
        currentParticipants = (meeting.value?.participants?.length ?? 1) - 1;
    }

    const subscriptions = await db.collection<Subscription>('subscriptions').find({ for: id }).toArray();
    const settings = await db.collection<{ for: string; name: string; url: string }>('settings').findOne({ for: id });

    if (!settings) return;

    const promises = [];

    for (const subscription of subscriptions) {
        if (
            event === PARTICIPANT_JOINED &&
            (subscription.each_join || (subscription.start && currentParticipants === 1))
        ) {
            if (currentParticipants === 1) {
                promises.push(
                    sendEmail(
                        subscription.email,
                        `${name ?? 'Someone'} just joined ${settings.name}! Join at ${settings.url}`,
                        subscription.phone ? undefined : `${name ?? 'Someone'} just joined ${settings.name}!`,
                    ).catch(() => console.warn('Failed...')),
                );
            } else {
                promises.push(
                    sendEmail(
                        subscription.email,
                        `${name ?? 'Someone'} just joined ${
                            settings.name
                        } (now at ${currentParticipants} people)! Join at ${settings.url}`,
                        subscription.phone ? undefined : `${name ?? 'Someone'} just joined ${settings.name}!`,
                    ).catch(() => console.warn('Failed...')),
                );
            }
        } else if (event === PARTICIPANT_LEFT && subscription.each_leave) {
            if (currentParticipants !== 0) {
                promises.push(
                    sendEmail(
                        subscription.email,
                        `${name ?? 'Someone'} just left ${settings.name}. ${currentParticipants} remain${
                            currentParticipants === 1 ? 's' : ''
                        }. Join at ${settings.url}`,
                        subscription.phone ? undefined : `${name ?? 'Someone'} just left ${settings.name}!`,
                    ).catch(() => console.log('Failed...')),
                );
            } else {
                promises.push(
                    sendEmail(
                        subscription.email,
                        `${name ?? 'Someone'} just left ${settings.name}. Nobody's left.`,
                        subscription.phone ? undefined : `Nobody's left in ${settings.name}.`,
                    ).catch(() => console.log('Failed...')),
                );
            }
        } else if (
            event === PARTICIPANT_LEFT &&
            subscription.end &&
            currentParticipants === 0 &&
            !subscription.each_leave
        ) {
            promises.push(
                sendEmail(
                    subscription.email,
                    `Nobody's left in ${settings.name}.`,
                    subscription.phone ? undefined : `Nobody's left in ${settings.name}.`,
                ).catch(() => console.log('Failed...')),
            );
        }
    }

    await Promise.all(promises);
}

const Hook: NextApiHandler = async (req, res) => {
    if (req.headers['authorization'] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).send('Not Authorized');
        return;
    }

    const id = req.body?.payload?.object?.id;
    const name = req.body?.payload?.object?.participant?.user_name;
    const uid = req.body?.payload?.object?.participant?.user_id;

    if (!id || !name || !uid) {
        res.status(400).send('Invalid Meeting ID');
        return;
    }

    await notify(req.body.event, id, name, uid);
    res.status(200).end('OK');
};

export default Hook;
