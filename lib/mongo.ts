import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true });

const mongo = client.connect().then((mongo) => mongo.db("zoomnotifier"));
export default mongo;
