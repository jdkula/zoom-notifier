import React, { ReactElement, useEffect } from 'react';
import { Card, CircularProgress } from '@material-ui/core';

import { useSnackbar } from 'notistack';
import { GetServerSideProps } from 'next';
import Root from '~/components/Root';
import { useRouter } from 'next/router';
import { getSettings } from '../api/[meetingId]/settings';

export default function MeetingLink({ redirect, name }: { redirect: string | null; name: string }): ReactElement {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();

    useEffect(() => {
        if (!redirect) {
            enqueueSnackbar('That meeting isn’t using link shortening!', { variant: 'error' });
            router.push('/');
        } else {
            window.location.href = redirect;
        }
    }, [redirect]);

    return (
        <Root title={`Zoom Notifier: Redirect to ${name}`}>
            <Card elevation={10}>
                <CircularProgress />
            </Card>
        </Root>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const meetingId = context.params?.meetingId as string;

    const settings = await getSettings(meetingId);

    if (!settings.shorten) {
        return { props: { name: settings.name, redirect: null } };
    }
    // Do reroute up here if we can.
    context.res.statusCode = 302;
    context.res.setHeader('Location', settings.url);

    return {
        props: {
            name: settings.name,
            redirect: settings.url,
        },
    };
};
