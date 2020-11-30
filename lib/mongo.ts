import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const mongo = client.connect().then((mongo) => mongo.db("zoomnotifier"));
mongo.then((db) => db.collection("subscriptions").createIndex({ email: 1, for: 1 }, { unique: true }));
mongo.then((db) => db.collection("settings").createIndex({ for: 1 }, { unique: true }));
export default mongo;
