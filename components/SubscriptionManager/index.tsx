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
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import Axios from 'axios';
import { useSnackbar } from 'notistack';
import React, { FC, useState } from 'react';
import NotifyPrefs from '~/lib/NotifyPrefs';
import ContactInformation from './ContactInformation';
import SubscriptionSettings from './SubscriptionSettings';

const SubscriptionManager: FC<{ meetingId: string; name: string }> = ({ meetingId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [contactOpen, setContactOpen] = useState(false);
    const [contactEntered, setContactEntered] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState(false);

    const [newSub, setNewSub] = useState(true);

    const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs | null>(null);

    const emailUpdate = (email: string | null, isPhone: boolean, preloaded?: true) => {
        setContactEntered(false);
        if (email === null) {
            setEmail('');
        } else {
            setEmail(email);
            if (preloaded) getSubInfo(email);
        }
        setPhone(isPhone);
    };

    const [working, setWorking] = useState(false);

    const subscribe = async () => {
        setWorking(true);
        try {
            await Axios.post(`/api/${meetingId}/sub`, {
                email,
                phone,
                ...notifyPrefs,
            });
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
            await Axios.delete(`/api/${meetingId}/sub/${email}`);
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

    const getSubInfo = async (email) => {
        setWorking(true);
        try {
            const { data } = await Axios.get(`/api/${meetingId}/sub/${email}`);

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
            setContactEntered(true);
            setContactOpen(false);
            setWorking(false);
        }
    };

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
                                {contactEntered ? email : 'Enter your contact information below.'}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <ContactInformation setEmail={emailUpdate} />
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    expanded={contactEntered && email && !contactOpen}
                    disabled={!contactEntered || !email}
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
                        disabled={!email}
                        onClick={() => getSubInfo(email)}
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
