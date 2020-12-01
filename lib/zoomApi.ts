import Axios from "axios";
import { accessSync } from "fs";
import base64 from "./base64";
import mongo from "./mongo";

const ZOOM_API_ROOT = "https://api.zoom.us/v2";
const ZOOM_REFRESH_ENDPOINT = "https://zoom.us/oauth/token";

const getEndpoint = (accessToken: string, endpoint: string): Promise<any> => {
    return Axios.get(ZOOM_API_ROOT + endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
    }).then((resp) => resp.data);
};

const refreshAccess = async (uid: string, refreshToken: string): Promise<string> => {
    const resp = await Axios.post("https://zoom.us/oauth/token", null, {
        headers: {
            Authorization: "Basic " + base64(process.env.ZOOM_OAUTH_ID + ":" + process.env.ZOOM_OAUTH_SECRET),
        },
        params: {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        },
    });

    const tokens = {
        refresh_token: resp.data.refresh_token,
        access_token: resp.data.access_token,
    };
    await (await mongo).collection("accounts").updateOne({ zoom_id: uid }, { $set: tokens });

    return tokens.access_token;
};

const zoomApi = async (uid: string, endpoint: string): Promise<any> => {
    const db = await mongo;

    const accts = await db.collection("accounts").findOne({ zoom_id: uid });
    if (!accts) return null;

    const { access_token, refresh_token } = accts;

    try {
        return await getEndpoint(access_token, endpoint);
    } catch (e) {
        try {
            const newAccessToken = await refreshAccess(uid, refresh_token);
            return await getEndpoint(newAccessToken, endpoint);
        } catch (e2) {
            return null;
        }
    }
};

export default zoomApi;
