import React, { FormEventHandler, ReactElement, ReactNode, useState } from 'react';
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
} from '@mui/material';
import Link from 'next/link';

import { useRouter } from 'next/router';
import Root from '~/components/Root';
import { Settings as SettingsIcon } from '@mui/icons-material';
import ZoomMeeting from '~/lib/zoom/ZoomMeeting';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

export default function Index(): ReactElement {
    const router = useRouter();
    const [meeting, setMeeting] = useState('');
    const [working, setWorking] = useState(false);

    const { data: session } = useSession();
    const { data: meetings, error } = useSWR<ZoomMeeting[] | null>('/api/zoom/meetings');

    const go: FormEventHandler = (e) => {
        e.preventDefault();
        setWorking(true);
        router.push('/meeting/[meetingId]', `/meeting/${meeting}`);
    };

    const meetingList = meetings?.map((meeting) => (
        <Link href={`/meeting/${meeting.id}`} key={meeting.uuid} passHref>
            <ListItem button onClick={() => setWorking(true)}>
                <ListItemText primary={meeting.topic} secondary={meeting.id} />
                <Box m={1} />
                <ListItemSecondaryAction>
                    <Link href={`/meeting/${meeting.id}/settings`} passHref>
                        <IconButton edge="end" onClick={() => setWorking(true)} size="large">
                            <SettingsIcon />
                        </IconButton>
                    </Link>
                </ListItemSecondaryAction>
            </ListItem>
        </Link>
    ));

    let meetingsCard: ReactNode | null = null;
    if (meetings && meetings.length > 0) {
        meetingsCard = (
            <Card elevation={10}>
                <Box m={2}>
                    <Typography align="center">Or, choose from one of your meetings:</Typography>
                    <List>{meetingList}</List>
                </Box>
            </Card>
        );
    } else if (!error && !meetings && session) {
        meetingsCard = (
            <Card elevation={10}>
                <Box m={3}>
                    <Box textAlign="center">
                        <CircularProgress />
                    </Box>
                </Box>
            </Card>
        );
    }

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
                {meetingsCard}
            </Box>
        </Root>
    );
}
