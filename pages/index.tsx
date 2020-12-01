import React, { ReactElement, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    TextField,
    Typography,
} from '@material-ui/core';
import Link from 'next/link';

import { useRouter } from 'next/router';
import Root from '~/components/Root';
import { getSession, useSession } from 'next-auth/client';
import { GetServerSideProps } from 'next';
import zoomApi from '~/lib/zoomApi';
import { Settings as SettingsIcon } from '@material-ui/icons';

export default function Index({ meetings }: { meetings: any[] }): ReactElement {
    const router = useRouter();
    const [meeting, setMeeting] = useState('');
    const [working, setWorking] = useState(false);

    const go = () => {
        setWorking(true);
        router.push(`/meeting/${meeting}`);
    };

    const meetingList = meetings.map((meeting) => (
        <Link href={`/meeting/${meeting.id}`} key={meeting.uuid}>
            <ListItem button onClick={() => setWorking(true)}>
                <ListItemText primary={meeting.topic} secondary={meeting.id} />
                <Box m={1} />
                <ListItemSecondaryAction>
                    <Link href={`/meeting/${meeting.id}/settings`}>
                        <IconButton edge="end" onClick={() => setWorking(true)}>
                            <SettingsIcon />
                        </IconButton>
                    </Link>
                </ListItemSecondaryAction>
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
                        <Button
                            fullWidth
                            color="primary"
                            variant="contained"
                            onClick={go}
                            disabled={working || meeting === ''}
                        >
                            {working ? <CircularProgress /> : 'Go'}
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
