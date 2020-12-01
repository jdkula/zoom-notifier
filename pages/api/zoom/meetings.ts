import { NextApiHandler } from 'next';
import { getSession } from 'next-auth/client';
import ZoomMeeting from '~/lib/zoom/ZoomMeeting';
import ZoomUser from '~/lib/zoom/ZoomUser';
import zoomApi from '~/lib/zoomApi';

const Meetings: NextApiHandler = async (req, res) => {
    const session = await getSession({ req });
    if (!session) return res.status(403).end('Authentication Required');

    const meetings = await zoomApi<{ meetings: ZoomMeeting[] } | null>(session['uid'], '/users/me/meetings');

    const user: ZoomUser | null = await zoomApi(session['uid'], '/users/me');
    if (meetings?.meetings && user) {
        const personalMeeting: ZoomMeeting | null = await zoomApi(session['uid'], `/meetings/${user.pmi}`);
        meetings.meetings.splice(0, 0, personalMeeting);
    }

    res.send(meetings?.meetings ?? null);
};

export default Meetings;
