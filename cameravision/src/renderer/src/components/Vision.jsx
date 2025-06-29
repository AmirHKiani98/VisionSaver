import React from 'react';
import {
    CircularProgress,
    Button
} from '@mui/material';
import ContextMenu from './ContextMenu';
const Vision = (props) => {
    const [src, setSrc] = React.useState(props.src || '');
    const [cameraUrl, setCameraUrl] = React.useState(props.cameraUrl || '');
    // Expose setSrc to parent via ref if provided
    React.useImperativeHandle(props.innerRef, () => ({
        setSrc,
    }), [setSrc]);

    // Loading and error state for <img>
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);
        setError(false);
    }, [src]);
    return (
        <ContextMenu
            menuItems={[
                { label: 'Delete', action: () => props.onRemove(props.id) },
                { label: 'Info', action:  props.onInfo || (() => alert(`ID: ${props.id}\nSource: ${src}`)) },
            ]}
            className="relative !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center"
            contextMenuId={props.id}
        >
            <Button data-key={props.key || ""} className='relative w-full h-full !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center'>
                <div className='w-full h-full flex items-center justify-center'>
                    {loading && !error && (
                        <CircularProgress color="secondary" />
                    )}
                    {error && (
                        <div className="text-red-600 text-center p-2">Stream unavailable</div>
                    )}
                    <img
                        className="w-full h-full"
                        id={props.id}
                        src={src}
                        alt="Vision"
                        style={{ display: loading || error ? 'none' : 'block' }}
                        onLoad={() => setLoading(false)}
                        onError={() => { setLoading(false); setError(true); }}
                    />
                </div>
            </Button>
        </ContextMenu>
    );
};

export default Vision;