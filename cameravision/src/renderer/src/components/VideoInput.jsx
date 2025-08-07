import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

const VideoInput = React.forwardRef(({ value, onChange, ...props }, ref) => {
    const today = dayjs();
    const [ip, setIp] = useState('');
    const [time, setTime] = useState(today);
    const [duration, setDuration] = useState(0);

    // Notify parent of changes if needed
    React.useEffect(() => {
        if (onChange) {
            onChange({ ip, time, duration });
        }
    }, [ip, time, duration, onChange]);

    return (
        <div className='flex flex-col gap-2.5' {...props} ref={ref}>
            <TextField
                value={ip}
                variant="outlined"
                className="bg-main-400 rounded-md w-full"
                label={<Typography className="text-white">IP</Typography>}
                onChange={(e) => setIp(e.target.value)}
            />
            <div className='flex flex-row gap-2.5'>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        className="bg-main-400 rounded-md w-1/3"
                        label={<Typography className="text-white">Start Date</Typography>}
                        maxDate={today}
                        value={time}
                        onChange={(newValue) => {
                            if (newValue) {
                                setTime(newValue.hour(time.hour()).minute(time.minute()));
                            }
                        }}
                        slotProps={{
                            field: { clearable: false }
                        }}
                    />
                    <TimePicker
                        className="bg-main-400 w-1/3 rounded-md"
                        label={<Typography className="text-white">Start Time</Typography>}
                        value={time}
                        onChange={(newValue) => {
                            if (newValue) {
                                setTime(time.date(newValue.date()).hour(newValue.hour()).minute(newValue.minute()));
                            }
                        }}
                        maxTime={
                            time && time.isSame(today, 'day')
                                ? dayjs()
                                : undefined
                        }
                    />
                </LocalizationProvider>
                <TextField
                    id="outlined-number"
                    type="number"
                    className="bg-main-400 w-1/3 rounded-md"
                    InputLabelProps={{
                        shrink: true
                    }}
                    value={duration}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= 0) {
                            setDuration(val);
                        }
                    }}
                    label={<Typography className="text-white">Duration (minutes)</Typography>}
                />
            </div>
        </div>
    );
});

export default VideoInput;