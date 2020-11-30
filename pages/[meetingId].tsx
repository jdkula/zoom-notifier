import React, { ReactElement, useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@material-ui/core";

import { PhoneNumberUtil } from "google-libphonenumber";
import Axios from "axios";
import { useSnackbar } from "notistack";
import { GetServerSideProps } from "next";
import { getSettings } from "./api/[meetingId]/settings";
const phoneUtil = PhoneNumberUtil.getInstance();

const Page = styled.div`
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-items: center;
    justify-content: center;
    height: 100%;
`;
const Container = styled.div`
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 20px 20px 100px -20px rgba(0, 0, 0, 1);
    display: flex;
    flex-direction: column;
    align-content: center;
`;

const CarrierSelect = styled(FormControl)`
    min-width: 120px;
`;

export default function Index({
    meetingId,
    name,
    url,
}: {
    meetingId: string;
    name: string;
    url: string;
}): ReactElement {
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [carrier, setCarrier] = useState("");

    const [meetingName, setMeetingName] = useState(name);
    const [meetingUrl, setMeetingUrl] = useState(url);

    const [phoneValid, setPhoneValid] = useState(false);

    useEffect(() => {
        if (phone) {
            setEmail(`${phone}@${carrier}`);
        }
    }, [phone, carrier]);

    useEffect(() => {
        if (phone === "") {
            setPhoneValid(true);
            return;
        }
        try {
            setPhoneValid(phone.length === 10 && phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, "US"), "US"));
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

        setPhone(window.localStorage.getItem("phone") ?? "");
        setCarrier(window.localStorage.getItem("carrier") ?? "");
        setEmail(window.localStorage.getItem("email") ?? "");
    }, [meetingId]);

    useEffect(() => {
        if (!meetingId) return;

        window.localStorage.setItem("phone", phone);
        window.localStorage.setItem("carrier", carrier);
        window.localStorage.setItem("email", email);

        if (start) window.localStorage.setItem(`${meetingId}_start`, "true");
        else window.localStorage.removeItem(`${meetingId}_start`);
        if (end) window.localStorage.setItem(`${meetingId}_end`, "true");
        else window.localStorage.removeItem(`${meetingId}_end`);
        if (eachJoin) window.localStorage.setItem(`${meetingId}_each_join`, "true");
        else window.localStorage.removeItem(`${meetingId}_each_join`);
        if (eachLeave) window.localStorage.setItem(`${meetingId}_each_leave`, "true");
        else window.localStorage.removeItem(`${meetingId}_each_leave`);
    });

    const [working, setWorking] = useState(false);
    const error = !phoneValid || (phone !== "" && !carrier);

    const finish = () => {
        enqueueSnackbar("Done!", { variant: "success" });
        setWorking(false);
    };

    const onError = () => {
        enqueueSnackbar("Couldn't subscribe!", { variant: "error" });
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

    const saveSettings = () => {
        Axios.put(`/api/${meetingId}/settings`, { name: meetingName, url: meetingUrl }).then(finish).catch(onError);
    };

    return (
        <Page>
            <Head>
                <title>Zoom Notifier: {name}</title>
            </Head>
            <Container>
                <Typography variant="h5">Notifications for {meetingId}</Typography>
                <Divider />
                <div>
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
                </div>
                <div>
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
                </div>
                <div>
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
                </div>
                <div>
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
                </div>
                <div style={{ padding: "1rem" }} />
                <div style={{ textAlign: "center" }}>
                    <TextField
                        variant="outlined"
                        label="Phone"
                        value={phone}
                        error={!phoneValid}
                        inputProps={{ "aria-label": "10-digit US phone number" }}
                        InputLabelProps={{ "aria-hidden": true }}
                        FormHelperTextProps={{ "aria-hidden": true }}
                        helperText={"10-digit US phone number"}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <span style={{ padding: "0.25rem" }} />
                    <CarrierSelect>
                        <InputLabel id="carrier-select-label" aria-hidden={true}>
                            Carrier
                        </InputLabel>
                        <Select
                            id="carrier-select"
                            labelId="carrier-select-label"
                            value={carrier}
                            error={phoneValid && phone !== "" && !carrier}
                            onChange={(e) => setCarrier(e.target.value as string)}
                        >
                            <MenuItem value="vtext.com">Verizon</MenuItem>
                            <MenuItem value="txt.att.net">AT{"&"}T</MenuItem>
                            <MenuItem value="messaging.sprintpcs.com">Sprint</MenuItem>
                            <MenuItem value="tmomail.net">T-Mobile</MenuItem>
                            <MenuItem value="msg.fi.google.com">Google Fi</MenuItem>
                            <MenuItem value="mms.cricketwireless.net">Cricket Wireless</MenuItem>
                        </Select>
                    </CarrierSelect>
                </div>
                <div style={{ width: "100%", textAlign: "center", padding: "0.5rem" }}>- or -</div>
                <div>
                    <TextField
                        variant="outlined"
                        label="Email"
                        value={email}
                        fullWidth
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div style={{ padding: "1rem" }} />
                <div style={{ textAlign: "center" }}>
                    {working && (
                        <>
                            <CircularProgress variant="indeterminate" />
                            <div style={{ padding: "1rem" }} />
                        </>
                    )}
                </div>
                <div style={{ textAlign: "center" }}>
                    <Button variant="contained" color="primary" disabled={error || working} onClick={subscribe}>
                        Subscribe
                    </Button>
                    <span style={{ padding: "1rem" }} />
                    <Button variant="outlined" color="secondary" disabled={error || working} onClick={unsubscribe}>
                        Unsubscribe
                    </Button>
                </div>
            </Container>
            <Box m={2} />
            <Container>
                <Typography variant="h5">Settings for {meetingId}</Typography>
                <Divider />
                <Box m={0.5} />
                <TextField label="Meeting Name" value={meetingName} onChange={(e) => setMeetingName(e.target.value)} />
                <Box m={0.5} />
                <TextField label="Meeting URL" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
                <Box m={0.5} />
                <Button fullWidth color="primary" variant="contained" onClick={saveSettings}>
                    Save
                </Button>
            </Container>
        </Page>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const meetingId = context.params?.meetingId as string;
    const settings = await getSettings(meetingId);
    return {
        props: {
            meetingId,
            name: settings.name,
            url: settings.url,
        },
    };
};
