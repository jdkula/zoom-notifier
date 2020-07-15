import { NextApiHandler } from "next";
import webpush from "web-push";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";

const MEETING_ENDED = "meeting.ended";
const MEETING_STARTED = "meeting.started";

webpush.setVapidDetails("mailto:jonathan@jdkula.dev", process.env.PUBLIC_KEY, process.env.PRIVATE_KEY);

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

    for (const subscription of subscriptions) {
        try {
            if (req.body.event === MEETING_STARTED && subscription.start) {
                await webpush.sendNotification(
                    subscription.subscription as any,
                    JSON.stringify({
                        title: "Someone just entered the Squad Zoom!",
                        options: {
                            badge: "https://zoom-notifier.jdkula.dev/started.png",
                            icon: "https://zoom-notifier.jdkula.dev/icon.png",
                            body: "Tap/click to join!",
                            data: {
                                url: process.env.MEETING_URL,
                            },
                        },
                        renotify: true,
                        tag: "started",
                    }),
                );
            } else if (req.body.event === MEETING_ENDED && subscription.end) {
                await webpush.sendNotification(
                    subscription.subscription as any,
                    JSON.stringify({
                        title: "Nobody's left in the Squad Zoom.",
                        options: {
                            badge: "https://zoom-notifier.jdkula.dev/ended.png",
                            icon: "https://zoom-notifier.jdkula.dev/icon.png",
                            data: {},
                        },
                        renotify: true,
                        tag: "ended",
                    }),
                );
            }
        } catch (e) {
            console.log("Failed...");
        }
    }

    res.end("OK");
};

export default Hook;
