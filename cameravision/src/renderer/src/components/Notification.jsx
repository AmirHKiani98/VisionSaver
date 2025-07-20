import React from 'react';

import { Snackbar, Alert } from '@mui/material';

const Notification = React.forwardRef(({ open, onClose, message = '', severity = 'info', autoHideDuration = 3000 }, ref) => {
    return (
        <Snackbar
            ref={ref}
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
});
export default Notification;