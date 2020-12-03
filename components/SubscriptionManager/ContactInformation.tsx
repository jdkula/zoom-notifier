import { CardContent, Box, TextField, InputLabel, Select, MenuItem, FormControl } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';
import { PhoneNumberUtil } from 'google-libphonenumber';
import styled from 'styled-components';
import DividerWithText from '../DividerWithText';

const phoneUtil = PhoneNumberUtil.getInstance();

const CarrierSelect = styled(FormControl)`
    min-width: 120px;
`;

const ContactInformation: FC<{ setEmail: (email: string | null, isPhone: boolean, preloaded?: true) => void }> = ({
    setEmail: updateEmail,
}) => {
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

    useEffect(() => {
        const phone = window.localStorage.getItem('phone') ?? '';
        const carrier = window.localStorage.getItem('carrier') ?? '';
        const email = window.localStorage.getItem('email') ?? '';
        setPhone(phone);
        setCarrier(carrier);
        setEmail(email);

        if (phone || carrier) {
            try {
                if (phone.length === 10 && phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'US'), 'US')) {
                    updateEmail(email, true, true);
                }
            } catch (e) {
                // do nothing
            }
        } else if (email) {
            updateEmail(email, true, undefined);
        }
    }, []);

    useEffect(() => {
        const isPhone = !!phone && !!carrier;
        const isValid = (!!isPhone && !!phoneValid) || (!!email && !phone);
        updateEmail(isValid ? email : null, isPhone);
    }, [email]);

    return (
        <CardContent>
            <Box pt={1} display="flex" justifyContent="center">
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
                        <MenuItem value="vzwpix.com">Verizon</MenuItem>
                        <MenuItem value="mms.att.net">AT{'&'}T</MenuItem>
                        <MenuItem value="pm.sprint.com">Sprint</MenuItem>
                        <MenuItem value="tmomail.net">T-Mobile</MenuItem>
                        <MenuItem value="msg.fi.google.com">Google Fi</MenuItem>
                        <MenuItem value="mms.cricketwireless.net">Cricket Wireless</MenuItem>
                    </Select>
                </CarrierSelect>
            </Box>
            <DividerWithText>Or</DividerWithText>
            <TextField
                variant="outlined"
                label="Email"
                value={email}
                fullWidth
                onChange={(e) => setEmail(e.target.value)}
            />
        </CardContent>
    );
};

export default ContactInformation;
