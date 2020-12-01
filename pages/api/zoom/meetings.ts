import { NextApiHandler } from "next";
import { getSession } from "next-auth/client";
import zoomApi from "~/lib/zoomApi";

const Meetings: NextApiHandler = async (req, res) => {
    const session = await getSession({ req });

    const meetings = await zoomApi(session["uid"], "/users/me/meetings");

    res.send(meetings);
};

export default Meetings;
