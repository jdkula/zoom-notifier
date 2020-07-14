import { NextApiHandler } from "next";

const Key: NextApiHandler = (req, res) => {
    res.end(process.env.PUBLIC_KEY);
};

export default Key;
