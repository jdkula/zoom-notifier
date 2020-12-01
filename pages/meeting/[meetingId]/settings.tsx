import React, { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@material-ui/core';

import { PhoneNumberUtil } from 'google-libphonenumber';
import Axios from 'axios';
import { useSnackbar } from 'notistack';
import { GetServerSideProps } from 'next';
import { getSettings } from '../../api/[meetingId]/settings';
import Root from '~/components/Root';
import { getSession, useSession } from 'next-auth/client';
import zoomApi from '~/lib/zoomApi';
import { useRouter } from 'next/router';
const phoneUtil = PhoneNumberUtil.getInstance();

const CarrierSelect = styled(FormControl)`
    min-width: 120px;
`;

const MeetingSettingsInner = ({ meetingId, name, url }: { meetingId: string; name: string; url: string }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [meetingName, setMeetingName] = useState(name);
    const [meetingUrl, setMeetingUrl] = useState(url);

    const [working, setWorking] = useState(false);

    const finish = () => {
        enqueueSnackbar('Done!', { variant: 'success' });
        setWorking(false);
    };

    const onError = () => {
        enqueueSnackbar("Couldn't subscribe!", { variant: 'error' });
        setWorking(false);
    };

    const saveSettings = () => {
        setWorking(true);
        Axios.put(`/api/${meetingId}/settings`, { name: meetingName, url: meetingUrl }).then(finish).catch(onError);
    };

    return (
        <>
            <Typography variant="h5" gutterBottom>
                Settings for {meetingId}
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
            <Box m={2} />
            <Button fullWidth color="primary" variant="contained" onClick={saveSettings} disabled={working}>
                {working ? <CircularProgress /> : 'Save'}
            </Button>
        </>
    );
};

export default function MeetingSettings(props: {
    meetingId: string;
    name: string;
    url: string;
    access: boolean;
}): ReactElement {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();

    useEffect(() => {
        if (!props.access) {
            enqueueSnackbar('You don’t have access to that meeting!', { variant: 'error' });
            router.push('/');
        }
    }, [props.access]);

    return (
        <Root title={`Zoom Notifier: Settings for ${props.name}`}>
            <Card elevation={10}>
                <CardContent>{props.access ? <MeetingSettingsInner {...props} /> : <CircularProgress />}</CardContent>
            </Card>
        </Root>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const meetingId = context.params?.meetingId as string;

    const session = await getSession(context);
    let meetingDetails: any = null;
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
            name: settings.name,
            url: settings.url,
            access: true,
        },
    };
};
