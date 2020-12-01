import Axios from 'axios';
import { NextApiHandler } from 'next';
import base64 from '~/lib/base64';
import { collections } from '~/lib/mongo';

const APP_DEAUTHED = 'app_deauthorized';

const Hook: NextApiHandler = async (req, res) => {
    const db = await collections;
    if (req.headers['authorization'] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).send('Not Authorized');
        return;
    }

    if (req.body.event !== APP_DEAUTHED) {
        res.status(400).send('Invalid event for endpoint!');
    }

    const id = req.body?.payload?.user_id;

    if (!id) {
        res.status(400).send('Invalid User ID');
        return;
    }

    db.accounts.deleteOne({ zoom_id: id });

    await Axios.post(
        'https://api.zoom.us/oauth/data/compliance',
        {
            client_id: process.env.ZOOM_CLIENT_ID,
            user_id: id,
            account_id: req.body.payload.account_id,
            deauthorization_event_received: req.body.payload,
            compliance_completed: true,
        },
        {
            headers: {
                Authorization: 'Basic ' + base64(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET),
            },
        },
    );

    res.status(200).end('OK');
};

export default Hook;
