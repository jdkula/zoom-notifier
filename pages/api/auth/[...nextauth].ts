import NextAuth from "next-auth";
import Providers from "next-auth/providers";

const options = {
    // Configure one or more authentication providers
    providers: [
        {
            id: "zoom",
            name: "Zoom",
            type: "oauth",
            version: "2.0",
            scope: ["meeting:read", "user_profile"],
            params: { grant_type: "authorization_code" },
            accessTokenUrl: "https://zoom.us/oauth/token",
            authorizationUrl: "https://zoom.us/oauth/authorize?response_type=code",
            profileUrl: "https://api.zoom.us/v2/users/me",
            profile: (profile) => ({
                ...profile,
            }),
            clientId: process.env.ZOOM_OAUTH_ID,
            clientSecret: process.env.ZOOM_OAUTH_SECRET,
        },
        // ...add more providers here
    ],

    // A database is optional, but required to persist accounts in a database
    database: process.env.DATABASE_URL,
};

export default (req, res) => NextAuth(req, res, options);
