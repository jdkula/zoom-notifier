import { MongoClient } from 'mongodb';
import NotifyPrefs from './NotifyPrefs';

const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const mongo = client.connect().then((mongo) => mongo.db('zoomnotifier'));
mongo.then((db) => db.collection('subscriptions').createIndex({ email: 1, meetingId: 1 }, { unique: true }));
mongo.then((db) => db.collection('settings').createIndex({ meetingId: 1 }, { unique: true }));

export default mongo;

export interface Subscription extends NotifyPrefs {
    _id?: never;
    email: string;
    meetingId: string;
    phone: boolean;
}

export interface Setting {
    _id?: never;
    name: string;
    url: string;
    meetingId: string;
    seriousMessagesOnly: boolean;
}

export interface Account {
    _id: string;
    access_token: string;
    refresh_token: string;
}

export interface Meeting {
    _id: string;
    participants: string[];
}

export const collections = mongo.then((db) => ({
    subscriptions: db.collection<Subscription>('subscriptions'),
    settings: db.collection<Setting>('settings'),
    accounts: db.collection<Account>('accounts'),
    meetings: db.collection<Meeting>('meetings'),
}));
