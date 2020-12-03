import React, { ReactElement, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    FormLabel,
    TextField,
    Tooltip,
    Typography,
} from '@material-ui/core';

import Axios from 'axios';
import { useSnackbar } from 'notistack';
import { GetServerSideProps } from 'next';
import { getSettings } from '../../api/[meetingId]/settings';
import Root from '~/components/Root';
import { getSession } from 'next-auth/client';
import zoomApi from '~/lib/zoomApi';
import { useRouter } from 'next/router';
import ZoomMeeting from '~/lib/zoom/ZoomMeeting';
import { Setting } from '~/lib/mongo';

const MeetingSettingsInner = ({ setting }: { setting: Setting }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [meetingName, setMeetingName] = useState(setting.name);
    const [meetingUrl, setMeetingUrl] = useState(setting.url);
    const [seriousOnly, setSeriousOnly] = useState(setting.seriousMessagesOnly);

    const [working, setWorking] = useState(false);

    const finish = () => {
        enqueueSnackbar('Done!', { variant: 'success' });
        setWorking(false);
    };

    const onError = () => {
        enqueueSnackbar('Error changing settings!', { variant: 'error' });
        setWorking(false);
    };

    const saveSettings = () => {
        setWorking(true);
        Axios.put(`/api/${setting.meetingId}/settings`, { name: meetingName, url: meetingUrl })
            .then(finish)
            .catch(onError);
    };

    return (
        <>
            <Typography variant="h5" gutterBottom>
                Settings for {setting.meetingId}
            </Typography>
            <TextField
                label="Meeting Name"
                value={meetingName}
                fullWidth
                multiline={true}
                onChange={(e) => setMeetingName(e.target.value)}
                variant="outlined"
            />
            <Box m={1} />
            <TextField
                label="Meeting URL"
                fullWidth
                multiline={true}
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                variant="outlined"
            />
            <div>
                <Tooltip
                    arrow
                    placement="left"
                    title="We randomize fun messages with each notification. You can disable that if you want."
                >
                    <FormControlLabel
                        label="Serious messages only"
                        control={<Checkbox checked={seriousOnly} onChange={(e) => setSeriousOnly(e.target.checked)} />}
                    />
                </Tooltip>
            </div>
            <Box m={2} />
            <Button fullWidth color="primary" variant="contained" onClick={saveSettings} disabled={working}>
                {working ? <CircularProgress /> : 'Save'}
            </Button>
        </>
    );
};

export default function MeetingSettings(props: { setting: Setting; access: boolean }): ReactElement {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();

    useEffect(() => {
        if (!props.access) {
            enqueueSnackbar('You don’t have access to that meeting!', { variant: 'error' });
            router.push('/');
        }
    }, [props.access]);

    return (
        <Root title={`Zoom Notifier: Settings for ${props.setting.name}`}>
            <Card elevation={10}>
                <CardContent>{props.access ? <MeetingSettingsInner {...props} /> : <CircularProgress />}</CardContent>
            </Card>
        </Root>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const meetingId = context.params?.meetingId as string;

    const session = await getSession(context);
    let meetingDetails: ZoomMeeting = null;
    if (session) {
        try {
            meetingDetails = await zoomApi(session['uid'], `/meetings/${meetingId}`);
        } catch (e) {
            // do nothing
        }
    }

    if (!meetingDetails) {
        return { props: { meetingId, access: false } };
    }

    const settings = await getSettings(meetingId, meetingDetails?.topic, meetingDetails?.join_url);

    return {
        props: {
            meetingId,
            setting: settings,
            access: true,
        },
    };
};
