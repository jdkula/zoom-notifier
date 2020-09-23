import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import { sendEmail } from "~/lib/sendEmail";
import Subscription from "~/lib/subscription";

const Sub: NextApiHandler<Subscription> = async (req, res) => {
    if (req.method !== "POST") {
        res.status(400).end();
        return;
    }
    const record = {
        _id: req.body.email,
        ...req.body,
    };
    const db = await mongo;
    const { upsertedCount } = await db
        .collection("subscriptions")
        .updateOne({ _id: record._id }, { $set: record }, { upsert: true });

    if (upsertedCount) {
        await sendEmail(
            req.body.email,
            "Subscribed to zoom notifications!",
            req.body.phone ? undefined : "Zoom Notifier notification",
        );
    } else {
        await sendEmail(
            req.body.email,
            "Updated your notification information!",
            req.body.phone ? undefined : "Zoom Notifier notification",
        );
    }

    res.send(record);
};

export default Sub;
