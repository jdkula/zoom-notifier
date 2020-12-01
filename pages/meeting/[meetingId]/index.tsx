import React, { FC, ReactElement, useEffect, useState } from 'react';
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
import { getSession } from 'next-auth/client';
import zoomApi from '~/lib/zoomApi';
const phoneUtil = PhoneNumberUtil.getInstance();

const CarrierSelect = styled(FormControl)`
    min-width: 120px;
`;

const DividerContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(1)}px ${({ theme }) => theme.spacing(2)}px;
`;
const DividerContent = styled.span`
    padding: ${({ theme }) => theme.spacing(1)}px;
    color: lightgray;
`;
const Border = styled.div`
    flex-grow: 1;
    height: 1px;
    background-color: lightgray;
`;

const Divider: FC = ({ children }) => (
    <DividerContainer>
        <Border />
        <DividerContent>{children}</DividerContent>
        <Border />
    </DividerContainer>
);

export default function MeetingSettings({ meetingId, name }: { meetingId: string; name: string }): ReactElement {
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [carrier, setCarrier] = useState('');

    const [phoneValid, setPhoneValid] = useState(false);

    useEffect(() => {
        if (phone) {
            setEmail(`${phone}@${carrier}`);
        }
    }, [phone, carrier]);

    useEffect(() => {
        if (phone === '') {
            setPhoneValid(true);
            return;
        }
        try {
            setPhoneValid(phone.length === 10 && phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'US'), 'US'));
        } catch (e) {
            setPhoneValid(false);
        }
    }, [phone]);

    const [start, setStart] = useState(true);
    const [end, setEnd] = useState(true);
    const [eachJoin, setEachJoin] = useState(false);
    const [eachLeave, setEachLeave] = useState(false);

    useEffect(() => {
        if (!meetingId) return;

        setStart(window.localStorage.getItem(`${meetingId}_start`) !== null);
        setEnd(window.localStorage.getItem(`${meetingId}_end`) !== null);
        setEachJoin(window.localStorage.getItem(`${meetingId}_each_join`) !== null);
        setEachLeave(window.localStorage.getItem(`${meetingId}_each_leave`) !== null);

        setPhone(window.localStorage.getItem('phone') ?? '');
        setCarrier(window.localStorage.getItem('carrier') ?? '');
        setEmail(window.localStorage.getItem('email') ?? '');
    }, [meetingId]);

    useEffect(() => {
        if (!meetingId) return;

        window.localStorage.setItem('phone', phone);
        window.localStorage.setItem('carrier', carrier);
        window.localStorage.setItem('email', email);

        if (start) window.localStorage.setItem(`${meetingId}_start`, 'true');
        else window.localStorage.removeItem(`${meetingId}_start`);
        if (end) window.localStorage.setItem(`${meetingId}_end`, 'true');
        else window.localStorage.removeItem(`${meetingId}_end`);
        if (eachJoin) window.localStorage.setItem(`${meetingId}_each_join`, 'true');
        else window.localStorage.removeItem(`${meetingId}_each_join`);
        if (eachLeave) window.localStorage.setItem(`${meetingId}_each_leave`, 'true');
        else window.localStorage.removeItem(`${meetingId}_each_leave`);
    });

    const [working, setWorking] = useState(false);
    const error = !phoneValid || (phone !== '' && !carrier);

    const finish = () => {
        enqueueSnackbar('Done!', { variant: 'success' });
        setWorking(false);
    };

    const onError = () => {
        enqueueSnackbar("Couldn't subscribe!", { variant: 'error' });
        setWorking(false);
    };

    const subscribe = () => {
        setWorking(true);
        Axios.post(`/api/${meetingId}/sub`, {
            start,
            end,
            email,
            each_join: eachJoin,
            each_leave: eachLeave,
            phone: phoneValid && !!phone,
        })
            .then(finish)
            .catch(onError);
    };

    const unsubscribe = () => {
        setWorking(true);
        Axios.delete(`/api/${meetingId}/sub/${email}`).then(finish).catch(onError);
    };

    return (
        <Root title={`Zoom Notifier: ${name}`}>
            <Card elevation={10}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Notifications for {name}
                    </Typography>
                    <Box display="flex" flexDirection="column">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={start || eachJoin}
                                    onChange={(e) => setStart(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Notify when the first person enters!"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eachJoin}
                                    onChange={(e) => setEachJoin(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Notify when the each person enters!"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={end || eachLeave}
                                    onChange={(e) => setEnd(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Notify when the last person leaves!"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eachLeave}
                                    onChange={(e) => setEachLeave(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Notify when the each person leaves!"
                        />
                    </Box>
                    <Box m={1}>
                        <TextField
                            variant="outlined"
                            label="Phone"
                            value={phone}
                            error={!phoneValid}
                            inputProps={{ 'aria-label': '10-digit US phone number' }}
                            InputLabelProps={{ 'aria-hidden': true }}
                            FormHelperTextProps={{ 'aria-hidden': true }}
                            helperText={'10-digit US phone number'}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <span style={{ padding: '0.25rem' }} />
                        <CarrierSelect>
                            <InputLabel id="carrier-select-label" aria-hidden={true}>
                                Carrier
                            </InputLabel>
                            <Select
                                id="carrier-select"
                                labelId="carrier-select-label"
                                value={carrier}
                                error={phoneValid && phone !== '' && !carrier}
                                onChange={(e) => setCarrier(e.target.value as string)}
                            >
                                <MenuItem value="vtext.com">Verizon</MenuItem>
                                <MenuItem value="txt.att.net">AT{'&'}T</MenuItem>
                                <MenuItem value="messaging.sprintpcs.com">Sprint</MenuItem>
                                <MenuItem value="tmomail.net">T-Mobile</MenuItem>
                                <MenuItem value="msg.fi.google.com">Google Fi</MenuItem>
                                <MenuItem value="mms.cricketwireless.net">Cricket Wireless</MenuItem>
                            </Select>
                        </CarrierSelect>
                    </Box>
                    <Divider>Or</Divider>
                    <TextField
                        variant="outlined"
                        label="Email"
                        value={email}
                        fullWidth
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Box m={1} />
                    {working && (
                        <Box textAlign={1}>
                            <CircularProgress variant="indeterminate" />
                            <Box m={1} />
                        </Box>
                    )}
                    <Box textAlign="center">
                        <Button variant="contained" color="primary" disabled={error || working} onClick={subscribe}>
                            Subscribe
                        </Button>
                        <Box m={1} component="span" />
                        <Button variant="outlined" color="secondary" disabled={error || working} onClick={unsubscribe}>
                            Unsubscribe
                        </Button>
                    </Box>
                </CardContent>
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

    const settings = await getSettings(meetingId, meetingDetails?.topic, meetingDetails?.join_url);

    return {
        props: {
            meetingId,
            name: settings.name,
            url: settings.url,
        },
    };
};
