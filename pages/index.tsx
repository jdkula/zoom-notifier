import React, { ReactElement, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { Box, Button, TextField, Typography } from "@material-ui/core";

import { useRouter } from "next/router";
const Page = styled.div`
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-items: center;
    justify-content: center;
    height: 100%;
`;
const Container = styled.div`
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 20px 20px 100px -20px rgba(0, 0, 0, 1);
    display: flex;
    flex-direction: column;
    align-content: center;
`;

export default function Index(): ReactElement {
    const router = useRouter();
    const [meeting, setMeeting] = useState("");

    const go = () => router.push(`/${meeting}`);

    return (
        <Page>
            <Head>
                <title>Zoom Notifier</title>
            </Head>
            <Container>
                <Typography align="center" variant="h4">
                    Zoom Notifier
                </Typography>
                <Box m={2} />
                <form onSubmit={go}>
                    <TextField
                        label="Zoom Meeting ID"
                        value={meeting}
                        fullWidth
                        onChange={(e) => setMeeting(e.target.value.replaceAll(/[^0-9]/g, ""))}
                    />
                </form>
                <Box m={2} />
                <Button fullWidth color="primary" variant="contained" onClick={go}>
                    Go
                </Button>
            </Container>
        </Page>
    );
}
