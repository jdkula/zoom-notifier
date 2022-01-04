import { CardContent, Box, TextField, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import React, { FC, SyntheticEvent, useEffect, useState } from 'react';
import { PhoneNumberUtil } from 'google-libphonenumber';
import styled from '@emotion/styled';

// Grabbed from https://support.myovision.com/help/ttm-carriers, converted with https://www.convertjson.com/html-table-to-json.htm
import CarrierMappings from '~/lib/carriers.json';
import { Autocomplete } from '@mui/material';

const phoneUtil = PhoneNumberUtil.getInstance();

const carrierOptions = Object.keys(CarrierMappings);

const CarrierSelect = styled(FormControl)`
    min-width: 200px;
`;

// Thank you https://emailregex.com/
const isEmailValid = (email: string) =>
    !!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.exec(
        email,
    );

interface ContactInformationProps {
    setPhone: (phone: string | null) => void;
    setEmail: (email: string | null) => void;
    setCarrier: (carrier: string | null) => void;
    setIfttt: (ifttt: string | null) => void;
    setSelection: (selection: 'phone' | 'email' | 'ifttt' | null) => void;
    phone: string | null;
    email: string | null;
    carrier: string | null;
    ifttt: string | null;
    selection: 'phone' | 'email' | 'ifttt' | null;
}

const ContactInformation: FC<ContactInformationProps> = ({
    phone,
    email,
    carrier,
    ifttt,
    selection,
    setPhone,
    setEmail,
    setCarrier,
    setIfttt,
    setSelection,
}) => {
    const [phoneValid, setPhoneValid] = useState(false);

    const emailValid = isEmailValid(email);

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

    const onSubmit = (e: SyntheticEvent<never>) => {
        e.preventDefault();
    };

    useEffect(() => {
        if (email) {
            setPhone('');
            setCarrier(null);
        }
    }, [email]);
    useEffect(() => {
        if (phone || carrier) {
            setEmail('');
        }
    }, [phone, carrier]);

    return (
        <CardContent>
            <form onSubmit={onSubmit}>
                <input type="submit" style={{ display: 'none' }} />
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    textAlign="center"
                >
                    <FormControl component="fieldset">
                        <RadioGroup
                            row
                            aria-label="color"
                            name="row-radio-buttons-group"
                            value={selection}
                            onChange={(_, selection) => {
                                setSelection(selection as 'phone' | 'email' | 'ifttt');
                                setCarrier(null);
                                setPhone(null);
                                setEmail(null);
                                setIfttt(null);
                            }}
                        >
                            <FormControlLabel value="phone" control={<Radio />} label="Phone" labelPlacement="top" />
                            <FormControlLabel value="email" control={<Radio />} label="Email" labelPlacement="top" />
                            <FormControlLabel value="ifttt" control={<Radio />} label="IFTTT" labelPlacement="top" />
                        </RadioGroup>
                    </FormControl>
                </Box>
                {selection === 'phone' && (
                    <Box pt={1} display="flex" justifyContent="center">
                        <TextField
                            variant="outlined"
                            label="Phone"
                            value={phone ?? ''}
                            error={!phoneValid}
                            inputProps={{ 'aria-label': '10-digit US phone number' }}
                            InputLabelProps={{ 'aria-hidden': true }}
                            FormHelperTextProps={{ 'aria-hidden': true }}
                            helperText={'10-digit US phone number'}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setEmail(null);
                                setIfttt(null);
                            }}
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
                                onChange={(_, value) => {
                                    setCarrier(value);
                                    setEmail(null);
                                    setIfttt(null);
                                }}
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
                )}
                {selection === 'email' && (
                    <TextField
                        variant="outlined"
                        label="Email"
                        value={email ?? ''}
                        error={!emailValid}
                        fullWidth
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setIfttt(null);
                            setCarrier(null);
                            setPhone(null);
                        }}
                    />
                )}
                {selection === 'ifttt' && (
                    <TextField
                        variant="outlined"
                        label="IFTTT Key"
                        value={ifttt ?? ''}
                        error={!ifttt}
                        fullWidth
                        onChange={(e) => {
                            setIfttt(e.target.value);
                            setEmail(null);
                            setCarrier(null);
                            setPhone(null);
                        }}
                    />
                )}
            </form>
        </CardContent>
    );
};

export default ContactInformation;
