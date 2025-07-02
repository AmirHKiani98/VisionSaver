import React from 'react';
import {
    CircularProgress,
    Button,
    Link
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
    const videoRef = React.useRef(null);

    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    return (
        <ContextMenu
            menuItems={[
                { label: 'Delete', action: () => props.onRemove(props.id) },
                { label: 'Info', action:  props.onInfo || (() => alert(`ID: ${props.id}\nSource: ${src}`)) },
            ]}
            className="relative !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center"
            contextMenuId={props.id}
        >
            <Button
                data-key={props.key || ""}
                className={`relative w-full h-full !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center`}
            >
                <div className='relative w-full h-full flex items-center justify-center'>
                    {loading && !error && (
                        <div className='absolute w-full h-full flex justify-center items-center'>
                            <CircularProgress className='w-full h-full' color="secondary" />
                        </div>
                    )}
                    {error && (
                        <div className='absolute w-full h-full flex justify-center items-center'>
                            <div className="text-red-600 text-center p-2">Stream unavailable</div>
                        </div>
                    )}
                    {props.img ? (
                        <img
                            className="w-full h-full"
                            id={props.id}
                            src={src}
                            alt="Vision"
                            style={{ display: loading || error ? 'none' : 'block' }}
                            onLoad={() => setLoading(false)}
                            onError={() => { setLoading(false); setError(true); }}
                        />
                    ) : props.video ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <Link href={`/record?record_id=${props.id}`}>
                                <video
                                    className="flex-1"
                                    id={props.id}
                                    src={src}
                                    ref={videoRef}
                                    controls={false}
                                    autoPlay={false}
                                    style={{ display: loading || error ? 'none' : 'block', pointerEvents: 'none' }}
                                    onLoadedData={() => setLoading(false)}
                                    onError={() => { setLoading(false); setError(true); console.error(error); }}
                                />
                            </Link>
                            <div
                                variant="containd"
                                size="small"
                                className={`bg-main-400 p-1 ${loading ? ' invisible' : ''}`}
                                onClick={handlePlayPause}
                                style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
                            >
                                Play/Pause
                            </div>
                        </div>
                    ) : null}
                </div>
            </Button>
        </ContextMenu>
    );
};

export default Vision;