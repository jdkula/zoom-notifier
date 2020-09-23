import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";

import mailgun from "mailgun-js";
import { sendEmail } from "../../lib/sendEmail";
export const mg = mailgun({ apiKey: process.env.MAILGUN_API, domain: process.env.MAILGUN_DOMAIN });

const MEETING_ENDED = "meeting.ended";
const MEETING_STARTED = "meeting.started";

async function notify(event: string) {
    const db = await mongo;
    const subscriptions = await db.collection("subscriptions").find<Subscription>().toArray();

    const promises = [];

    for (const subscription of subscriptions) {
        if (event === MEETING_STARTED && subscription.start) {
            promises.push(
                sendEmail(
                    subscription.email,
                    "Someone just joined the Squad Zoom! Join at " + process.env.MEETING_URL,
                    subscription.phone ? undefined : "Someone just joined the Squad Zoom!",
                ).catch((e) => console.warn("Failed...")),
            );
        } else if (event === MEETING_ENDED && subscription.end) {
            promises.push(
                sendEmail(
                    subscription.email,
                    "Nobody's left in the Squad Zoom.",
                    subscription.phone ? undefined : "Nobody's left in the Squad Zoom.",
                ).catch((e) => console.log("Failed...")),
            );
        }
    }

    await Promise.all(promises);
}

const Hook: NextApiHandler = async (req, res) => {
    if (req.headers["authorization"] !== process.env.VERIFICATION_TOKEN) {
        res.status(401).send("Not Authorized");
        return;
    }

    if (req.body?.payload?.object?.id !== process.env.MEETING_ID) {
        res.status(400).send("Invalid Meeting ID");
        return;
    }

    res.status(200).end("OK");

    await notify(req.body.event);
};

export default Hook;
