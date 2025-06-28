import React from 'react';
import {
    CircularProgress,
    Button
} from '@mui/material';

const Vision = (props) => {
    const [src, setSrc] = React.useState(props.src || '');
    const [status, setStatus] = React.useState(null);

    React.useEffect(() => {
        if (!src) return;
        fetch(src, { method: 'HEAD' })
            .then(res => setStatus(res.status))
            .catch(() => setStatus(null));
    }, [src]);

    return (
        
            <Button className='relative !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center'>
                <div className='w-full h-full flex items-center justify-center'>
                    {status === 200 ? (
                        <img
                            className="w-full h-full object-contain"
                            id={props.id}
                            src={src}
                            alt="Vision"
                        />
                    ) : (
                        <>
                        <CircularProgress color="secondary"></CircularProgress>
                        </>
                    )}
                </div>
            </Button>
    );
};

export default Vision;