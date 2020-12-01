import Axios from "axios";
import { NextApiHandler } from "next";
import base64 from "~/lib/base64";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";
import zoomApi from "~/lib/zoomApi";

const APP_DEAUTHED = "app_deauthorized";

type Meeting = { _id: string; participants: string[] };

const Hook: NextApiHandler = async (req, res) => {
    if (req.headers["authorization"] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).send("Not Authorized");
        return;
    }

    const id = req.body?.payload?.user_id;

    if (!id) {
        res.status(400).send("Invalid User ID");
        return;
    }

    await (await mongo).collection("accounts").deleteOne({ zoom_id: id });

    await Axios.post(
        "https://api.zoom.us/oauth/data/compliance",
        {
            client_id: process.env.ZOOM_CLIENT_ID,
            user_id: id,
            account_id: req.body.payload.account_id,
            deauthorization_event_received: req.body.payload,
            compliance_completed: true,
        },
        {
            headers: {
                Authorization: "Basic " + base64(process.env.ZOOM_CLIENT_ID + ":" + process.env.ZOOM_CLIENT_SECRET),
            },
        },
    );

    res.status(200).end("OK");
};

export default Hook;
