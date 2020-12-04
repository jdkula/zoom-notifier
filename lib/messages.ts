import { collections, Setting } from './mongo';
import CarrierMappings from '~/lib/carriers.json';

export enum MessageType {
    START = 'start',
    END = 'end',
    JOIN = 'join',
    LEAVE = 'leave',
}

export type Match = {
    email: string | null;
    phone: string | null;
    carrier: keyof typeof CarrierMappings | null;
    message: string;
};

function replaceMatches(s: string, replacements: Record<string, string>): string {
    for (const key of Object.keys(replacements)) {
        s = s.replace(new RegExp('\\$\\{\\s*?' + key + '\\s*?\\}', 'g'), replacements[key]);
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
    const shortLink = `https://${process.env.ROOT_DOMAIN}/l/${setting.meetingId}`;
    const replacements = {
        room: setting.name,
        url: setting.shorten ? shortLink : setting.url,
        name: name,
        current: currentParticipants.toString(),
        previous: (currentParticipants + delta).toString(),
    };

    return matches.map((match) => ({
        ...match,
        message: replaceMatches(match.message, replacements),
    }));
}