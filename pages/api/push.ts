import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";

const Push: NextApiHandler<Subscription> = async (req, res) => {
    const record = {
        _id: req.body.subscription.endpoint,
        ...req.body,
    };
    const db = await mongo;
    await db.collection("subscriptions").updateOne({ _id: record._id }, { $set: record }, { upsert: true });

    res.send(record);
};

export default Push;
