import { NextApiHandler } from 'next';
import NextAuth from 'next-auth';
import mongo from '~/lib/mongo';

const options = {
    // Configure one or more authentication providers
    providers: [
        {
            id: 'zoom',
            name: 'Zoom',
            type: 'oauth',
            version: '2.0',
            scope: ['meeting:read', 'user_profile'],
            params: { grant_type: 'authorization_code' },
            accessTokenUrl: 'https://zoom.us/oauth/token',
            authorizationUrl: 'https://zoom.us/oauth/authorize?response_type=code',
            profileUrl: 'https://api.zoom.us/v2/users/me',
            profile: (profile) => ({
                ...profile,
                name: profile.first_name + ' ' + profile.last_name,
            }),
            clientId: process.env.ZOOM_OAUTH_ID,
            clientSecret: process.env.ZOOM_OAUTH_SECRET,
        },
        // ...add more providers here
    ],

    callbacks: {
        jwt: async (token, _, account) => {
            if (account) {
                await (await mongo)
                    .collection('accounts')
                    .findOneAndUpdate(
                        { zoom_id: account.id },
                        { $set: { refresh_token: account.refreshToken, access_token: account.accessToken } },
                        { returnOriginal: false, upsert: true },
                    );
                token.uid = account.id;
            }
            return token;
        },
        session: async (session, jwt) => {
            session.uid = jwt.uid;
            return session;
        },
    },
};

const Auth: NextApiHandler = (req, res) => NextAuth(req, res, options);

export default Auth;
