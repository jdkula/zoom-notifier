import React, { ReactElement } from 'react';

import { GetServerSideProps } from 'next';
import { getSettings } from '../../api/[meetingId]/settings';
import Root from '~/components/Root';
import { getSession } from 'next-auth/client';
import zoomApi from '~/lib/zoomApi';
import SubscriptionManager from '~/components/SubscriptionManager';
import ZoomMeeting from '~/lib/zoom/ZoomMeeting';

export default function MeetingSettings(props: { meetingId: string; name: string }): ReactElement {
    return (
        <Root title={`Zoom Notifier: ${props.name}`}>
            <SubscriptionManager {...props} />
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

    const settings = await getSettings(meetingId, meetingDetails?.topic, meetingDetails?.join_url);

    return {
        props: {
            meetingId,
            name: settings.name,
            url: settings.url,
        },
    };
};
