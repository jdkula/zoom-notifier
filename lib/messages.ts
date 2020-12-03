import { collections, Setting, Subscription } from './mongo';
import { sendEmail } from './sendEmail';

export enum MessageType {
    START = 'start',
    END = 'end',
    JOIN = 'join',
    LEAVE = 'leave',
}

export type Match = { email: string; message: string; phone: boolean };

function replaceMatches(s: string, replacements: Record<string, string>): string {
    for (const key of Object.keys(replacements)) {
        s = s.replaceAll(new RegExp('\\$\\{\\s*?' + key + '\\s*?\\}', 'g'), replacements[key]);
    }
    return s;
}

export async function prepareMessages(
    type: MessageType,
    setting: Setting,
    name: string,
    currentParticipants: number,
): Promise<Match[]> {
    const db = await collections;
    const messageMatch = setting.seriousMessagesOnly ? { type, serious: true } : { type };

    const matches = await db.subscriptions
        .aggregate<Match>([
            { $match: { meetingId: setting.meetingId, [type]: true } },
            { $addFields: { messageType: type } },
            {
                $lookup: {
                    from: 'messages',
                    as: 'messages',
                    pipeline: [{ $match: messageMatch }, { $sample: { size: 1 } }],
                },
            },
            {
                $project: {
                    _id: 0,
                    email: 1,
                    phone: 1,
                    message: {
                        $let: { vars: { message: { $arrayElemAt: ['$messages', 0] } }, in: '$$message.message' },
                    },
                },
            },
        ])
        .toArray();

    const delta = type === MessageType.JOIN || type === MessageType.START ? -1 : 1;
    const replacements = {
        room: setting.name,
        url: setting.url,
        name: name,
        current: currentParticipants.toString(),
        previous: (currentParticipants + delta).toString(),
    };

    return matches.map((match) => ({
        ...match,
        message: replaceMatches(match.message, replacements),
    }));
}
