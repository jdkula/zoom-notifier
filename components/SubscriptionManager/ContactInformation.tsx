import { CardContent, Box, TextField, InputLabel, Select, MenuItem, FormControl } from '@material-ui/core';
import React, { FC, SyntheticEvent, useEffect, useState } from 'react';
import { PhoneNumberUtil } from 'google-libphonenumber';
import styled from 'styled-components';
import DividerWithText from '../DividerWithText';

// Grabbed from https://support.myovision.com/help/ttm-carriers, converted with https://www.convertjson.com/html-table-to-json.htm
import CarrierMappings from '~/lib/carriers.json';
import { Autocomplete } from '@material-ui/lab';

const phoneUtil = PhoneNumberUtil.getInstance();

const carrierOptions = Object.keys(CarrierMappings);

const CarrierSelect = styled(FormControl)`
    min-width: 200px;
`;

const ContactInformation: FC<{ setEmail: (email: string | null, isPhone: boolean, preloaded?: true) => void }> = ({
    setEmail: updateEmail,
}) => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [carrier, setCarrier] = useState<null | string>(null);

    const [phoneValid, setPhoneValid] = useState(false);

    useEffect(() => {
        if (phone) {
            setEmail(phone + (CarrierMappings[carrier] ?? ''));
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
        const carrier = window.localStorage.getItem('carrier') ?? null;
        const email = window.localStorage.getItem('email') ?? '';
        setPhone(phone);
        if (carrierOptions.includes(carrier)) {
            setCarrier(carrier);
        }
        setEmail(email);

        if (phone || carrier) {
            try {
                if (
                    carrierOptions.includes(carrier) &&
                    phone.length === 10 &&
                    phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'US'), 'US')
                ) {
                    updateEmail(email, true, true);
                }
            } catch (e) {
                // do nothing
            }
        } else if (email) {
            updateEmail(email, true, undefined);
        }
    }, []);

    const updateProxy = (forceContinue: boolean) => {
        const isPhone = !!phone && !!carrier;
        const isValid = (!!isPhone && !!phoneValid) || (!!email && !phone);
        updateEmail(isValid ? email : null, isPhone, forceContinue || undefined);
    };

    const onSubmit = (e: SyntheticEvent<never>) => {
        e.preventDefault();
        updateProxy(true);
    };

    useEffect(() => {
        updateProxy(false);
    }, [email]);

    useEffect(() => {
        window.localStorage.setItem('phone', phone);
        window.localStorage.setItem('carrier', carrier);
        window.localStorage.setItem('email', email);
    }, [phone, email, carrier]);

    return (
        <CardContent>
            <form onSubmit={onSubmit}>
                <input type="submit" style={{ display: 'none' }} />
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
                        <Autocomplete
                            id="carrier-select"
                            autoComplete
                            autoHighlight
                            autoSelect
                            options={carrierOptions}
                            value={carrier}
                            onChange={(_, value) => setCarrier(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={phoneValid && phone !== '' && !carrier}
                                    label="Select Carrier"
                                    variant="outlined"
                                />
                            )}
                        />
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
            </form>
        </CardContent>
    );
};

export default ContactInformation;
