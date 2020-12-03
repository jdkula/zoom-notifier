import { NextApiHandler } from 'next';
import { Match, MessageType, prepareMessages } from '~/lib/messages';
import { collections } from '~/lib/mongo';

import { sendEmail } from '../../lib/sendEmail';

enum Event {
    PARTICIPANT_JOINED = 'meeting.participant_joined',
    PARTICIPANT_LEFT = 'meeting.participant_left',
}

function prepareEmail(match: Match): [string, string, string | undefined] {
    const { email, message, phone } = match;
    const subject = phone ? undefined : message + ' EOM';

    return [email, message, subject];
}

const eventMapping = {
    [Event.PARTICIPANT_JOINED]: '$addToSet',
    [Event.PARTICIPANT_LEFT]: '$pull',
};
const deltas = {
    [Event.PARTICIPANT_JOINED]: +1,
    [Event.PARTICIPANT_LEFT]: -1,
};
async function updateMeeting(event: Event, meetingId: string, userId: string): Promise<number | null> {
    const db = await collections;

    const meeting = await db.meetings.findOneAndUpdate(
        { _id: meetingId },
        { [eventMapping[event]]: { participants: userId } },
        { returnOriginal: true, upsert: true },
    );

    const participants = meeting.value?.participants ?? [];

    if (
        (event === Event.PARTICIPANT_JOINED && participants.includes(userId)) ||
        (event === Event.PARTICIPANT_LEFT && !participants.includes(userId))
    ) {
        return null; // duplicate notification!
    }

    return participants.length + deltas[event];
}

async function notify(event: Event, meetingId: string, name: string, userId: string): Promise<void> {
    const db = await collections;

    const currentParticipants = await updateMeeting(event, meetingId, userId);
    if (currentParticipants === null) return;

    const settings = await db.settings.findOne({ meetingId });
    if (!settings) return;

    let type: MessageType;
    if (event === Event.PARTICIPANT_JOINED) {
        type = currentParticipants === 1 ? MessageType.START : MessageType.JOIN;
    } else {
        type = currentParticipants === 0 ? MessageType.END : MessageType.LEAVE;
    }

    const promises = (await prepareMessages(type, settings, name, currentParticipants))
        .map((match) => prepareEmail(match))
        .map((args) => sendEmail(...args));

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
