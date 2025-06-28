import React from 'react';

import { Snackbar, Alert } from '@mui/material';

const Notification = React.forwardRef(({ open, handleClose, message = '', severity = 'info' }, ref) => {
    return (
        <Snackbar
            ref={ref}
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
});
export default Notification;