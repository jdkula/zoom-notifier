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
import { phoneToEmail } from '~/lib/phone';
import { Subscription } from '~/lib/mongo';
import { PhoneNumberUtil } from 'google-libphonenumber';
// Grabbed from https://support.myovision.com/help/ttm-carriers, converted with https://www.convertjson.com/html-table-to-json.htm
import CarrierMappings from '~/lib/carriers.json';

const phoneUtil = PhoneNumberUtil.getInstance();

const carrierOptions = Object.keys(CarrierMappings);

const SubscriptionManager: FC<{ meetingId: string; name: string }> = ({ meetingId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);
    const [carrier, setCarrier] = useState<string | null>(null);
    const [ifttt, setIfttt] = useState<string | null>(null);
    const [selection, setSelection] = useState<'phone' | 'email' | 'ifttt' | null>(null);

    const [contactOpen, setContactOpen] = useState(false);
    const [contactEntered, setContactEntered] = useState(false);
    const hasContactInformation = !!email || (!!phone && !!carrier) || !!ifttt;

    const [newSub, setNewSub] = useState(true);
    const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs | null>(null);
    const [working, setWorking] = useState(false);

    const preloadContactInfo = (
        email: string | null,
        phone: string | null,
        carrier: string | null,
        ifttt: string | null,
    ) => {
        if (email || (phone && carrier) || ifttt) {
            getSubInfo(email, phone, carrier, ifttt);
        }
    };

    useEffect(() => {
        setContactEntered(false);
        setContactOpen(false);
        setNotifyPrefs(null);
    }, [email, phone, carrier, ifttt]);

    useEffect(() => {
        const phone = window.localStorage.getItem('__ZN_phone');
        const carrier = window.localStorage.getItem('__ZN_carrier');
        const email = window.localStorage.getItem('__ZN_email');
        const ifttt = window.localStorage.getItem('__ZN_ifttt');
        const selection = window.localStorage.getItem('__ZN_selection');
        setPhone(phone ?? '');
        if (carrierOptions.includes(carrier)) {
            setCarrier(carrier);
        }
        setEmail(email ?? '');

        if (selection) {
            setSelection(selection as 'phone' | 'email' | 'ifttt');
        }

        if (selection === 'phone') {
            try {
                if (
                    carrierOptions.includes(carrier) &&
                    phone.length === 10 &&
                    phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'US'), 'US')
                ) {
                    setPhone(phone);
                    setCarrier(carrier);
                    setEmail(email);
                    setIfttt(ifttt);
                    preloadContactInfo(email, phone, carrier, ifttt);
                }
            } catch (e) {
                // do nothing
            }
        } else if (selection === 'email') {
            setPhone(null);
            setCarrier(null);
            setEmail(email);
            setIfttt(null);
            preloadContactInfo(email, phone, carrier, ifttt);
        } else if (selection === 'ifttt') {
            setPhone(null);
            setCarrier(null);
            setEmail(null);
            setIfttt(ifttt);
            preloadContactInfo(email, phone, carrier, ifttt);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('__ZN_phone', phone);
        window.localStorage.setItem('__ZN_carrier', carrier);
        window.localStorage.setItem('__ZN_email', email);
        window.localStorage.setItem('__ZN_ifttt', ifttt);
        window.localStorage.setItem('__ZN_selection', selection);
    }, [phone, email, carrier, ifttt, selection]);

    const subscribe = async () => {
        setWorking(true);
        try {
            await Axios.post(`/api/${meetingId}/sub`, {
                email,
                phone,
                carrier,
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
            await Axios.delete(`/api/${meetingId}/sub`, { data: { email, phone, carrier, ifttt } });
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

    const getSubInfo = async (email, phone, carrier, ifttt, cont = true) => {
        setWorking(true);
        try {
            const { data } = await Axios.get(`/api/${meetingId}/sub`, { params: { email, phone, carrier, ifttt } });

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
    if (contactEntered && phone && carrier) {
        subtitle = phoneToEmail(phone, carrier);
    } else if (contactEntered && email) {
        subtitle = email;
    } else if (contactEntered && ifttt) {
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
                                setEmail,
                                setPhone,
                                setCarrier,
                                setIfttt,
                                setSelection,
                                selection,
                                carrier,
                                email,
                                ifttt,
                                phone,
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
                        onClick={() => getSubInfo(email, phone, carrier, ifttt)}
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
