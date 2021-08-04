import { NextApiHandler } from 'next';
import { Match, MessageType, prepareMessages } from '~/lib/messages';
import { collections, Summary } from '~/lib/mongo';

import { sendEmail } from '../../lib/sendEmail';

import { phoneToEmail } from '~/lib/phone';
import Axios from 'axios';
import { sendText } from '~/lib/sendText';

enum Event {
    PARTICIPANT_JOINED = 'meeting.participant_joined',
    PARTICIPANT_LEFT = 'meeting.participant_left',
}

function prepareEmail(match: Match): [to: string, message: string, subject: string | undefined] | null {
    const { email, message, phone, carrier, url } = match;
    if (phone || carrier || !email) return null;

    const to = email ?? phoneToEmail(phone, carrier);
    const subject = phone ? undefined : message;

    const messageWithJoin = match.url ? `${message} Join at: ${url}` : message;

    return [to, messageWithJoin, subject];
}

function prepareText(match: Match): [to: string, message: string] {
    const { email, message, phone, url } = match;
    if (!phone || email) return null;

    const messageWithJoin = match.url ? `${message} Join at: ${url}` : message;

    return [phone, messageWithJoin];
}

async function notifyIfttt(match: Match): Promise<void> {
    const { ifttt, message, url, room } = match;

    if (!ifttt) return;

    await Axios.post(`https://maker.ifttt.com/trigger/zoom_notification/with/key/${ifttt}`, {
        value1: message + (url ? ' Click to join!' : ''),
        value2: room,
        ...(url && { value3: url }),
    });
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

async function notify(
    event: Event,
    meetingId: string,
    name: string,
    userId: string,
    eventTs: number,
): Promise<Summary> {
    const db = await collections;

    const currentParticipants = await updateMeeting(event, meetingId, userId);
    if (currentParticipants === null) return;

    const settings = await db.settings.findOne({ meetingId });
    if (!settings) return [];
    if (settings.lastEventTime >= eventTs) return []; // ensure no duplicate or out of order vents
    await db.settings.updateOne({ meetingId, lastEventTime: { $lt: eventTs } }, { $set: { lastEventTime: eventTs } });

    let type: MessageType;
    if (event === Event.PARTICIPANT_JOINED) {
        type = currentParticipants === 1 ? MessageType.START : MessageType.JOIN;
    } else {
        type = currentParticipants === 0 ? MessageType.END : MessageType.LEAVE;
    }

    const messages = await prepareMessages(type, settings, name, currentParticipants);
    const textPromises = messages
        .map(prepareText)
        .filter((text) => text !== null)
        .map((args) => sendText(...args));

    const emailPromises = messages
        .map(prepareEmail)
        .filter((email) => email !== null)
        .map((args) => sendEmail(...args));

    const iftttPromises = messages.filter((match) => !!match.ifttt).map(notifyIfttt);

    await Promise.all(textPromises);
    await Promise.all(emailPromises);
    await Promise.all(iftttPromises);

    return messages;
}

async function logTimestamp(
    event: Event,
    eventTs: number,
    receivedTs: number,
    respondedTs: number | null,
    finishedTs: number,
    summary: Summary,
    meetingId: string,
) {
    const db = await collections;

    await db.auditLog.insertOne({
        event_type: event,
        event_timestamp: new Date(eventTs),
        received_timestamp: new Date(receivedTs),
        responded_timestamp: respondedTs ? new Date(respondedTs) : null,
        finished_timestamp: new Date(finishedTs),
        meeting_id: meetingId,
        summary,
    });
}

const Hook: NextApiHandler = async (req, res) => {
    const receivedTs = Date.now();
    if (req.headers['authorization'] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).send('Not Authorized');
        return;
    }

    const id = req.body?.payload?.object?.id;
    const name = req.body?.payload?.object?.participant?.user_name;
    const uid = req.body?.payload?.object?.participant?.user_id;
    const eventTs = req.body?.event_ts;

    if (!id || !name || !uid || !eventTs) {
        res.status(400).send('Invalid Meeting ID');
        return;
    }

    let respondedTs: number | null = null;
    if (process.env.VERCEL) {
        const summary = await notify(req.body.event, id, name, uid, eventTs);
        await logTimestamp(req.body.event, req.body.event_ts, receivedTs, respondedTs, Date.now(), summary, id);
    } else {
        // run in background, respond immediately
        notify(req.body.event, id, name, uid, eventTs).then((summary) =>
            logTimestamp(req.body.event, req.body.event_ts, receivedTs, respondedTs, Date.now(), summary, id),
        );
    }
    res.status(204).end();
    respondedTs = Date.now();
};

export default Hook;
