import { NextApiHandler } from "next";
import mongo from "~/lib/mongo";
import { sendEmail } from "~/lib/sendEmail";

const Unsub: NextApiHandler = async (req, res) => {
    const { email } = req.query;
    const db = await mongo;

    if (!email) {
        res.status(400).end("Email not found");
        return;
    }

    if (req.method === "DELETE") {
        await db.collection("subscriptions").deleteOne({ _id: email });

        await sendEmail(email as string, "Subscription successfully removed!", "Zoom Notifier");

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
