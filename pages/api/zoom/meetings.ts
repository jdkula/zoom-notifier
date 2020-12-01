import { NextApiHandler } from 'next';
import { getSession } from 'next-auth/client';
import ZoomMeeting from '~/lib/zoom/ZoomMeeting';
import zoomApi from '~/lib/zoomApi';

const Meetings: NextApiHandler = async (req, res) => {
    const session = await getSession({ req });
    if (!session) return res.status(403).end('Authentication Required');

    const meetings = await zoomApi<{ meetings: ZoomMeeting[] }>(session['uid'], '/users/me/meetings');

    res.send(meetings?.meetings ?? null);
};

export default Meetings;
