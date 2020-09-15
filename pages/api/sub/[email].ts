import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";

const Unsub: NextApiHandler = async (req, res) => {
    const { email } = req.query;
    const db = await mongo;

    if (req.method === "DELETE") {
        await db.collection("subscriptions").deleteOne({ _id: email });

        res.send("OK");
    } else {
        const hasOne = await db.collection("subscriptions").findOne({ _id: email });

        if (!hasOne) {
            res.status(404).end("Not Found");
        } else {
            res.status(200).end("Found");
        }
    }
};

export default Unsub;
