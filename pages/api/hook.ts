import { NextApiHandler } from "next";

const Hook: NextApiHandler = (req, res) => {
    res.end(process.env.PUBLIC_KEY);
};

export default Hook;
