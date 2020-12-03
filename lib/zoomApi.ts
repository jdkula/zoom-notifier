import Axios from 'axios';
import base64 from './base64';
import { collections } from './mongo';

const ZOOM_API_ROOT = 'https://api.zoom.us/v2';
const ZOOM_REFRESH_ENDPOINT = 'https://zoom.us/oauth/token';

const getEndpoint = <T>(accessToken: string, endpoint: string): Promise<T> => {
    return Axios.get(ZOOM_API_ROOT + endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
        .then((resp) => resp.data)
        .catch((e) => console.warn(e));
};

const refreshAccess = async (uid: string, refreshToken: string): Promise<string> => {
    const db = await collections;

    const resp = await Axios.post(ZOOM_REFRESH_ENDPOINT, null, {
        headers: {
            Authorization: 'Basic ' + base64(process.env.ZOOM_OAUTH_ID + ':' + process.env.ZOOM_OAUTH_SECRET),
        },
        params: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        },
    });

    const tokens = {
        refresh_token: resp.data.refresh_token,
        access_token: resp.data.access_token,
    };
    await db.accounts.updateOne({ _id: uid }, { $set: tokens });

    return tokens.access_token;
};

const zoomApi = async <T = never>(uid: string, endpoint: string): Promise<T> => {
    const db = await collections;
    const accts = await db.accounts.findOne({ _id: uid });
    if (!accts) return null;

    const { access_token, refresh_token } = accts;

    try {
        return await getEndpoint<T>(access_token, endpoint);
    } catch (e) {
        try {
            const newAccessToken = await refreshAccess(uid, refresh_token);
            return await getEndpoint<T>(newAccessToken, endpoint);
        } catch (e2) {
            return null;
        }
    }
};

export default zoomApi;
