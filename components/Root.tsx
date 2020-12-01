import { AppBar, Box, Button, Link, Toolbar, Typography } from '@material-ui/core';
import Head from 'next/head';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useSession, signOut, signIn } from 'next-auth/client';

const Page = styled.div`
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
`;

const Root: FC<{ title?: string }> = ({ children, title }) => {
    const [session] = useSession();

    const doLogOut = () => {
        return signOut();
    };

    const doLogIn = () => {
        return signIn('zoom');
    };

    return (
        <Box height="100%" display="flex" flexDirection="column">
            <Head>
                <title>{title}</title>
            </Head>

            <AppBar position="static">
                <Toolbar>
                    <Link href="/" color="inherit">
                        <Typography variant="h5" color="inherit">
                            {title}
                        </Typography>
                    </Link>
                    <Box flexGrow={1} />
                    {session ? (
                        <Button variant="contained" onClick={doLogOut}>
                            Log Out
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={doLogIn}>
                            Log In
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Box m={2} />
            <Page>{children}</Page>
        </Box>
    );
};

export default Root;
