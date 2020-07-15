import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import Subscription from "~/lib/subscription";

const List: NextApiHandler = async (req, res) => {
    res.status(403).end();
    return;
    const db = await mongo;
    const collection = await db.collection("subscriptions").find<Subscription>().toArray();
    res.end(JSON.stringify(collection));
};

export default List;
