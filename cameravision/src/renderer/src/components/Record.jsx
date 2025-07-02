import react from 'react';
import {
    CircularProgress
} from '@mui/material';

const Record = (props) => {
    const [src, setSrc] = react.useState(props.src || '');
    const [loading, setLoading] = react.useState(true);
    const [error, setError] = react.useState(false);
    const [env, setEnv] = react.useState(props.env || null);
    const [playbackRate, setPlaybackRate] = react.useState(1);
    const [currentTime, setCurrentTime] = react.useState(0);
    const [duration, setDuration] = react.useState(0);
    const recordId = props.recordId || null;
    const videoRef = react.useRef(null);

    react.useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    react.useEffect(() => {
        if (!env) {
            // Don't do anything until env is loaded
            return;
        } else {
            console.log(`Environment Variables Loaded:`, recordId, env.BACKEND_SERVER_DOMAIN, env.BACKEND_SERVER_PORT, env.GET_RECORD_URL);
        }
        if (recordId && env && env.BACKEND_SERVER_DOMAIN && env.BACKEND_SERVER_PORT && env.GET_RECORD_URL) {
            fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_URL}/${recordId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.url) {
                        setSrc(data.url);
                        setLoading(false);
                        setError(false);
                    }
                })
                .catch(error => {
                    console.error('Error fetching record URL:', error);
                    setError(true);
                    setLoading(false);
                });
        } else if (!recordId) {
            console.error('No record ID provided in query parameters');
            setError(true);
            setLoading(false);

        } else {
            setError(true);
            setLoading(false);
        }
    }, [env, recordId]);

    react.useEffect(() => {
        setLoading(true);
        setError(false);
    }, [src]);

    // Update playback rate when changed
    react.useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Update current time as video plays
    react.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
    }, [src]);

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = value;
        }
        setCurrentTime(value);
    };

    const handleSpeedChange = (e) => {
        setPlaybackRate(Number(e.target.value));
    };

    return (
        <div className='relative w-full h-full flex flex-col items-center justify-center'>
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
                {src && (
                    <video
                        ref={videoRef}
                        src={src}
                        onLoadedData={() => setLoading(false)}
                        onError={() => setError(true)}
                        autoPlay
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            {src && !error && (
                <div className="w-full flex flex-col items-center mt-2">
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSliderChange}
                        className="w-full"
                        step="0.1"
                    />
                    <div className="flex items-center mt-2">
                        <span className="mr-2 text-sm">
                            {Math.floor(currentTime)} / {Math.floor(duration)}s
                        </span>
                        <label className="ml-2 text-sm">
                            Speed:
                            <select value={playbackRate} onChange={handleSpeedChange} className="ml-1">
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={1.5}>1.5x</option>
                                <option value={2}>2x</option>
                            </select>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Record;