import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";

const Unsub: NextApiHandler = async (req, res) => {
    const { id } = req.body;
    const db = await mongo;
    await db.collection("subscriptions").deleteOne({ _id: id });

    res.send("OK");
};

export default Unsub;
