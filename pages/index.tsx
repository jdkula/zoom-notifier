import React, { ReactElement, useEffect, useState } from "react";
import Head from "next/head";
import styled, { createGlobalStyle } from "styled-components";
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@material-ui/core";

import { PhoneNumberUtil } from "google-libphonenumber";
import Axios from "axios";
const phoneUtil = PhoneNumberUtil.getInstance();

const GlobalStyle = createGlobalStyle`
    html {
        width: 100%;
        height: 100%;
        font-family: "Helvetica", sans-serif;
    }
    body {
        background-color: #4d7ac4;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    * {
        box-sizing: border-box;
    }
`;

const Page = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;
const Container = styled.div`
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 20px 20px 100px -20px rgba(0, 0, 0, 1);
`;

const CarrierSelect = styled(FormControl)`
    min-width: 120px;
`;

export default function Index(): ReactElement {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [carrier, setCarrier] = useState("");

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
            setPhoneValid(phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, "US"), "US"));
        } catch (e) {
            setPhoneValid(false);
        }
    }, [phone]);

    const [start, setStart] = useState(true);
    const [end, setEnd] = useState(true);

    useEffect(() => {
        setStart(window.localStorage.getItem("start") !== "false");
        setEnd(window.localStorage.getItem("end") !== "false");
    }, []);

    useEffect(() => {
        window.localStorage.setItem("start", start.toString());
        window.localStorage.setItem("end", end.toString());
    }, [start, end]);

    const subscribe = () => {
        Axios.post("/api/sub", {
            start,
            end,
            email,
        });
    };

    const unsubscribe = () => {
        Axios.delete(`/api/sub/${email}`);
    };

    return (
        <Page>
            <Head>
                <title>Squad Zoom</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </Head>
            <GlobalStyle />
            <Container>
                <div>
                    <FormControlLabel
                        control={
                            <Checkbox checked={start} onChange={(e) => setStart(e.target.checked)} color="primary" />
                        }
                        label="Notify when the first person enters!"
                    />
                </div>
                <div>
                    <FormControlLabel
                        control={<Checkbox checked={end} onChange={(e) => setEnd(e.target.checked)} color="primary" />}
                        label="Notify when the last person leaves!"
                    />
                </div>
                <div style={{ padding: "1rem" }} />
                <div>
                    <TextField
                        variant="outlined"
                        label="Phone"
                        value={phone}
                        error={!phoneValid}
                        helperText={phoneValid ? "" : "This phone number is not valid"}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <span style={{ padding: "0.25rem" }} />
                    <CarrierSelect>
                        <InputLabel id="carrier-select-label">Carrier</InputLabel>
                        <Select
                            id="carrier-select"
                            labelId="carrier-select-label"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value as string)}
                        >
                            <MenuItem value="vtext.com">Verizon</MenuItem>
                            <MenuItem value="txt.att.net">AT{"&"}T</MenuItem>
                            <MenuItem value="messaging.sprintpcs.com">Sprint</MenuItem>
                            <MenuItem value="tmomail.net">T-Mobile</MenuItem>
                            <MenuItem value="msg.fi.google.com">Google Fi</MenuItem>
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
                    <Button variant="contained" color="primary" disabled={!phoneValid} onClick={subscribe}>
                        Subscribe
                    </Button>
                    <span style={{ padding: "1rem" }} />
                    <Button variant="outlined" color="secondary" disabled={!phoneValid} onClick={unsubscribe}>
                        Unsubscribe
                    </Button>
                </div>
            </Container>
        </Page>
    );
}
