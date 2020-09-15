import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
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
    await db.collection("subscriptions").updateOne({ _id: record._id }, { $set: record }, { upsert: true });

    res.send(record);
};

export default Sub;
