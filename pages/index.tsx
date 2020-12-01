import React, { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import {
    Box,
    Button,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@material-ui/core';
import Link from 'next/link';

import { useRouter } from 'next/router';
import Root from '~/components/Root';
import { getSession, useSession } from 'next-auth/client';
import Axios from 'axios';
import { GetServerSideProps } from 'next';
import zoomApi from '~/lib/zoomApi';

export default function Index({ meetings }: { meetings: any[] }): ReactElement {
    const router = useRouter();
    const [meeting, setMeeting] = useState('');
    const [session, loading] = useSession();

    const go = () => router.push(`/meeting/${meeting}`);

    const meetingList = meetings.map((meeting) => (
        <Link href={`/meeting/${meeting.id}`} key={meeting.uuid}>
            <ListItem button>
                <ListItemText primary={meeting.topic} secondary={meeting.id} />
            </ListItem>
        </Link>
    ));

    return (
        <Root title="Zoom Notifier">
            <Box>
                <Card elevation={10}>
                    <CardContent>
                        <Typography align="center">Enter your meeting ID below:</Typography>
                        <Box m={2} />
                        <form onSubmit={go}>
                            <TextField
                                label="Zoom Meeting ID"
                                value={meeting}
                                fullWidth
                                onChange={(e) => setMeeting(e.target.value.replaceAll(/[^0-9]/g, ''))}
                            />
                        </form>
                        <Box m={2} />
                        <Button fullWidth color="primary" variant="contained" onClick={go}>
                            Go
                        </Button>
                    </CardContent>
                </Card>
                <Box m={4} />
                {meetings.length > 0 && (
                    <Card elevation={10}>
                        <CardContent>
                            <Typography align="center">Or, choose from one of your meetings:</Typography>
                            <List>{meetingList}</List>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Root>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    const meetings = session && (await zoomApi(session['uid'], '/users/me/meetings?page_size=300'));
    const personal = session && (await zoomApi(session['uid'], '/users/me'));
    if (meetings?.meetings && personal) {
        const personalMeeting = await zoomApi(session['uid'], `/meetings/${personal.pmi}`);
        meetings.meetings.splice(0, 0, personalMeeting);
    }
    return { props: { meetings: meetings?.meetings || [] } };
};
