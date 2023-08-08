import { AppBar, Box, Button, Link, Toolbar, Typography } from '@mui/material';
import Head from 'next/head';
import React, { FC, ReactNode } from 'react';
import styled from '@emotion/styled';
import { useSession, signOut } from 'next-auth/react';

const Page = styled.div`
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
`;

const Root: FC<{ title?: string; children: ReactNode }> = ({ children, title }) => {
    const { data } = useSession();

    const doLogOut = () => {
        return signOut();
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
                    {data ? (
                        <Button variant="outlined" onClick={doLogOut} color="inherit">
                            Log Out
                        </Button>
                    ) : null}
                </Toolbar>
            </AppBar>
            <Box m={2} />
            <Page>{children}</Page>
        </Box>
    );
};

export default Root;
