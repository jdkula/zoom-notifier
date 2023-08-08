import {
    Card,
    CardContent,
    Typography,
    Accordion,
    AccordionSummary,
    Box,
    AccordionDetails,
    Button,
    CircularProgress,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { FC, useEffect, useState } from 'react';
import NotifyPrefs from '~/lib/NotifyPrefs';
import ContactInformation from './ContactInformation';
import SubscriptionSettings from './SubscriptionSettings';
import { Subscription } from '~/lib/mongo';

const SubscriptionManager: FC<{ meetingId: string; name: string }> = ({ meetingId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [ifttt, setIfttt] = useState<string | null>(null);

    const [contactOpen, setContactOpen] = useState(false);
    const [contactEntered, setContactEntered] = useState(false);
    const hasContactInformation = !!ifttt;

    const [newSub, setNewSub] = useState(true);
    const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs | null>(null);
    const [working, setWorking] = useState(false);

    const preloadContactInfo = (ifttt: string | null) => {
        if (ifttt) {
            getSubInfo(ifttt);
        }
    };

    useEffect(() => {
        setContactEntered(false);
        setContactOpen(false);
        setNotifyPrefs(null);
    }, [ifttt]);

    useEffect(() => {
        const ifttt = window.localStorage.getItem('__ZN_ifttt');
        if (ifttt) {
            preloadContactInfo(ifttt);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('__ZN_ifttt', ifttt);
    }, [ifttt]);

    const subscribe = async () => {
        setWorking(true);
        try {
            await Axios.post(`/api/${meetingId}/sub`, {
                ifttt,
                ...notifyPrefs,
            } as Subscription);
            enqueueSnackbar('Subscribed!', { variant: 'success' });
            setNewSub(false);
        } catch (e) {
            enqueueSnackbar('Failed to subscribe!', { variant: 'error' });
        } finally {
            setWorking(false);
        }
    };

    const unsubscribe = async () => {
        setWorking(true);
        try {
            await Axios.delete(`/api/${meetingId}/sub`, { data: { ifttt } });
            enqueueSnackbar('Unsubscribed!', { variant: 'success' });
            setNewSub(true);
            setContactEntered(false);
            setContactOpen(false);
            setNotifyPrefs(null);
        } catch (e) {
            enqueueSnackbar('Failed to unsubscribe!', { variant: 'error' });
        } finally {
            setWorking(false);
        }
    };

    const getSubInfo = async (ifttt, cont = true) => {
        setWorking(true);
        try {
            const { data } = await Axios.get(`/api/${meetingId}/sub`, { params: { ifttt } });

            setNotifyPrefs(data);
            setNewSub(false);
        } catch (e) {
            setNotifyPrefs({
                start: true,
                end: true,
                join: false,
                leave: false,
            });
            setNewSub(true);
        } finally {
            if (cont) {
                setContactEntered(true);
                setContactOpen(false);
                setWorking(false);
            }
        }
    };

    let subtitle: string;
    if (contactEntered && ifttt) {
        subtitle = 'IFTTT Key: ' + ifttt;
    } else {
        subtitle = 'Enter your contact information below.';
    }

    return (
        <Card elevation={10}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Your Notification Preferences
                </Typography>
                <Accordion
                    expanded={!contactEntered || contactOpen}
                    onChange={(_, expanded) => setContactOpen(expanded)}
                >
                    <AccordionSummary expandIcon={<ExpandMore />} aria-controls="step1-content" id="step1-content">
                        <Box>
                            <Typography display="block">Step 1: Contact information</Typography>
                            <Typography variant="caption" color="textSecondary">
                                {contactEntered ? subtitle : 'Enter your contact information below.'}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <ContactInformation
                            {...{
                                setIfttt,
                                ifttt,
                            }}
                        />
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    expanded={contactEntered && hasContactInformation && !contactOpen}
                    disabled={!contactEntered || !hasContactInformation}
                    onChange={(_, expanded) => setContactOpen(!expanded)}
                >
                    <AccordionSummary expandIcon={<ExpandMore />} aria-controls="step2-content" id="step2-content">
                        <Box>
                            <Typography display="block">Step 2: Notifications</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {notifyPrefs && <SubscriptionSettings prefs={notifyPrefs} updatePrefs={setNotifyPrefs} />}
                    </AccordionDetails>
                </Accordion>

                <Box m={1} />
                {working ? (
                    <Button disabled fullWidth>
                        <CircularProgress variant="indeterminate" />
                    </Button>
                ) : contactEntered ? (
                    newSub ? (
                        <Button variant="contained" fullWidth color="primary" onClick={subscribe}>
                            Subscribe
                        </Button>
                    ) : (
                        <Box textAlign="center">
                            <Button variant="contained" color="primary" onClick={subscribe}>
                                Update Subscription
                            </Button>
                            <Box m={1} component="span" />
                            <Button variant="outlined" color="secondary" onClick={unsubscribe}>
                                Unsubscribe
                            </Button>
                        </Box>
                    )
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!hasContactInformation}
                        onClick={() => getSubInfo(ifttt)}
                        fullWidth
                    >
                        Continue
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default SubscriptionManager;
