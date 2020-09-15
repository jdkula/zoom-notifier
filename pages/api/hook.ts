import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";

import mailgun from "mailgun-js";
const mg = mailgun({ apiKey: process.env.MAILGUN_API, domain: process.env.MAILGUN_DOMAIN });

const MEETING_ENDED = "meeting.ended";
const MEETING_STARTED = "meeting.started";

async function sendEmail(to, text) {
    await mg.messages().send({
        from: process.env.MAILGUN_FROM,
        to,
        text,
    });
}

const Hook: NextApiHandler = async (req, res) => {
    if (req.headers["authorization"] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).end();
        return;
    }

    if (req.body?.payload?.object?.id !== process.env.MEETING_ID) {
        res.status(400).end();
        return;
    }

    const db = await mongo;
    const subscriptions = await db.collection("subscriptions").find<Subscription>().toArray();
    const promises = [];

    for (const subscription of subscriptions) {
        try {
            if (req.body.event === MEETING_STARTED && subscription.start) {
                promises.push(
                    sendEmail(
                        subscription.email,
                        "Someone just joined the Squad Zoom! Join at ***REMOVED***/",
                    ),
                );
            } else if (req.body.event === MEETING_ENDED && subscription.end) {
                promises.push(sendEmail(subscription.email, "Nobody's left in the Squad Zoom."));
            }
        } catch (e) {
            console.log("Failed...");
        }
    }

    res.end("OK");
};

export default Hook;
