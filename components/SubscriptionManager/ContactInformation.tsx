import { CardContent, Box, TextField, FormControl } from '@material-ui/core';
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

// Thank you https://emailregex.com/
const isEmailValid = (email: string) =>
    !!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.exec(
        email,
    );

interface ContactInformationProps {
    preload: (email: string | null, phone: string | null, carrier: string | null) => void;
    setPhone: (phone: string | null) => void;
    setEmail: (email: string | null) => void;
    setCarrier: (carrier: string | null) => void;
}

const ContactInformation: FC<ContactInformationProps> = ({
    setEmail: updateEmail,
    setPhone: updatePhone,
    setCarrier: updateCarrier,
    preload,
}) => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [carrier, setCarrier] = useState<null | string>(null);

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

    useEffect(() => {
        const phone = window.localStorage.getItem('__ZN_phone');
        const carrier = window.localStorage.getItem('__ZN_carrier');
        const email = window.localStorage.getItem('__ZN_email');
        setPhone(phone ?? '');
        if (carrierOptions.includes(carrier)) {
            setCarrier(carrier);
        }
        setEmail(email ?? '');

        if (phone || carrier) {
            try {
                if (
                    carrierOptions.includes(carrier) &&
                    phone.length === 10 &&
                    phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'US'), 'US')
                ) {
                    console.log('Preloading...?');
                    window.setTimeout(() => preload(email, phone, carrier), 1);
                }
            } catch (e) {
                // do nothing
            }
        } else if (email) {
            window.setTimeout(() => preload(email, phone, carrier), 1);
        }
    }, []);

    const updateProxy = (forceContinue: boolean) => {
        const isPhone = !!phone && !!carrier;
        const isValid = (isPhone && phoneValid && !!carrier) || (!!email && !isPhone && emailValid);
        console.log('updateProxy called with', { email, phone, carrier, isPhone, isValid, emailValid, phoneValid });
        updateEmail(isValid ? email || null : null);
        updatePhone(isValid ? phone || null : null);
        updateCarrier(carrier);
        if (forceContinue) {
            preload(isValid ? email : null, isValid ? phone : null, carrier);
        }
    };

    const onSubmit = (e: SyntheticEvent<never>) => {
        e.preventDefault();
        updateProxy(true);
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

    useEffect(() => {
        updateProxy(false);
    }, [email, phoneValid, emailValid, phone, carrier]);

    useEffect(() => {
        window.localStorage.setItem('__ZN_phone', phone);
        window.localStorage.setItem('__ZN_carrier', carrier);
        window.localStorage.setItem('__ZN_email', email);
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
                    error={!emailValid && (!phoneValid || !carrier)}
                    fullWidth
                    onChange={(e) => setEmail(e.target.value)}
                />
            </form>
        </CardContent>
    );
};

export default ContactInformation;
