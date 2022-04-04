import { NextApiHandler } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import ZoomProvider from 'next-auth/providers/zoom';
import mongo from '~/lib/mongo';

const options: NextAuthOptions = {
    secret: process.env.AUTH_SECRET,
    // Configure one or more authentication providers
    providers: [
        ZoomProvider({
            clientId: process.env.ZOOM_OAUTH_ID,
            clientSecret: process.env.ZOOM_OAUTH_SECRET,
        }),
        // ...add more providers here
    ],

    callbacks: {
        jwt: async ({ token, account }) => {
            if (account) {
                await (await mongo)
                    .collection('accounts')
                    .findOneAndUpdate(
                        { _id: account.id },
                        { $set: { refresh_token: account.refreshToken, access_token: account.accessToken } },
                        { returnDocument: 'after', upsert: true },
                    );
                token.uid = account.id;
            }
            return token;
        },
        session: async ({ session, token }) => {
            session.uid = token.uid;
            return session;
        },
    },
};

const Auth: NextApiHandler = (req, res) => NextAuth(req, res, options);

export default Auth;
