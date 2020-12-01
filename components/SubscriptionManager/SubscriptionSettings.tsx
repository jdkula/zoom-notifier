import { Box, FormControlLabel, Checkbox } from '@material-ui/core';
import React, { FC, useState, useEffect } from 'react';
import NotifyPrefs from '~/lib/NotifyPrefs';

const SubscriptionSettings: FC<{ prefs: NotifyPrefs; updatePrefs: (newPrefs: NotifyPrefs) => void }> = ({
    prefs,
    updatePrefs,
}) => {
    const [start, setStart] = useState(prefs.start);
    const [end, setEnd] = useState(prefs.end);
    const [eachJoin, setEachJoin] = useState(prefs.each_join);
    const [eachLeave, setEachLeave] = useState(prefs.each_leave);

    useEffect(() => {
        updatePrefs({
            start,
            end,
            each_join: eachJoin,
            each_leave: eachLeave,
        });
    }, [start, end, eachJoin, eachLeave]);

    return (
        <Box display="flex" flexDirection="column">
            <FormControlLabel
                control={
                    <Checkbox
                        checked={start || eachJoin}
                        disabled={eachJoin}
                        onChange={(e) => setStart(e.target.checked)}
                        color="primary"
                    />
                }
                label="Notify when the first person enters!"
            />
            <FormControlLabel
                control={
                    <Checkbox checked={eachJoin} onChange={(e) => setEachJoin(e.target.checked)} color="primary" />
                }
                label="Notify when the each person enters!"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={end || eachLeave}
                        disabled={eachLeave}
                        onChange={(e) => setEnd(e.target.checked)}
                        color="primary"
                    />
                }
                label="Notify when the last person leaves!"
            />
            <FormControlLabel
                control={
                    <Checkbox checked={eachLeave} onChange={(e) => setEachLeave(e.target.checked)} color="primary" />
                }
                label="Notify when the each person leaves!"
            />
        </Box>
    );
};

export default SubscriptionSettings;
