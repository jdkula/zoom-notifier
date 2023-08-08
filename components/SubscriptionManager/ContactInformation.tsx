import { CardContent, TextField } from '@mui/material';
import React, { FC, SyntheticEvent } from 'react';

interface ContactInformationProps {
    setIfttt: (ifttt: string | null) => void;
    ifttt: string | null;
}

const ContactInformation: FC<ContactInformationProps> = ({ ifttt, setIfttt }) => {
    const onSubmit = (e: SyntheticEvent<never>) => {
        e.preventDefault();
    };

    return (
        <CardContent>
            <form onSubmit={onSubmit}>
                <input type="submit" style={{ display: 'none' }} />

                <TextField
                    variant="outlined"
                    label="IFTTT Key"
                    value={ifttt ?? ''}
                    error={!ifttt}
                    fullWidth
                    onChange={(e) => {
                        setIfttt(e.target.value);
                    }}
                />
            </form>
        </CardContent>
    );
};

export default ContactInformation;
