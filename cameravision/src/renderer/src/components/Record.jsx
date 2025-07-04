import "../assets/main.css"
import react, { forwardRef, useImperativeHandle } from 'react';
import {
    CircularProgress,
    Select,
    MenuItem,
    InputLabel,
    Typography,
    FormControl,
    Slider,
    Button
} from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { Form } from 'react-router-dom';

const Record = forwardRef((props, ref) => {
    const [src, setSrc] = react.useState(props.src || '');
    const [loading, setLoading] = react.useState(true);
    const [error, setError] = react.useState(false);
    const [env, setEnv] = react.useState(props.env || null);
    const [playbackRate, setPlaybackRate] = react.useState(1);
    const [currentTime, setCurrentTime] = react.useState(0);
    const [duration, setDuration] = react.useState(0);
    const [passedPercentage, setPassedPercentage] = react.useState(0);
    const [completedPercentage, setCompletedPercentage] = react.useState(0);
    const recordId = props.recordId || null;
    const videoRef = react.useRef(null);
    const playButtonRef = react.useRef(null);
    
    useImperativeHandle(ref, () => ({
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        video: videoRef.current
    }));


    react.useEffect(() => {
        if (props.pendingSeekTime != null && videoRef.current && duration > 0) {
            videoRef.current.currentTime = props.pendingSeekTime;
            setPassedPercentage(Math.floor((props.pendingSeekTime / duration) * 100));
        }
    }, [props.pendingSeekTime, duration]);


    react.useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    react.useEffect(() => {
        
    })

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

    const formatSecomds = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes< 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

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

    // State to track if video is playing
    const [isPlaying, setIsPlaying] = react.useState(false);

    // Play/pause handlers
    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    // Listen for play/pause events to sync state
    react.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [src]);
    // Set keybinds
    react.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === ' ') {
                e.preventDefault(); // Prevent scrolling
                handlePlayPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlaying]);

    return (
        <div
            className="flex flex-col items-center justify-center bg-white/20 p-2.5"
            style={{
                width: '100%',
                maxWidth: '100%',
            }}
        >
            <div className='relative flex items-center justify-center w-auto max-w-full'>
                {loading && !error && (
                    <div className='absolute inset-0 flex justify-center items-center z-10'>
                        <CircularProgress color="secondary" />
                    </div>
                )}
                {error && (
                    <div className='absolute inset-0 flex justify-center items-center z-10'>
                        <div className="text-red-600 text-center p-2">Stream unavailable</div>
                    </div>
                )}
                {src && (
                    <div className='relative inline-block'>
                        <video
                            ref={videoRef}
                            src={src}
                            onLoadedData={() => setLoading(false)}
                            onError={() => setError(true)}
                            className="block max-w-full max-h-[60vh] w-auto h-auto object-contain"
                            style={{
                                background: 'black',
                                display: 'block',
                                margin: 0,
                                padding: 0,
                            }}
                        />
                        <Slider
                            value={currentTime}
                            min={0}
                            max={duration}
                            onChange={handleSliderChange}
                            className="w-full left-0 scale-x-[1.01] right-0 -bottom-1 m-0 p-0 h-52"
                            step={0.1}
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: '-0px',
                                width: '100%',
                                height: '8px',
                                padding: 0,
                                backgroundColor: 'rgba(250, 250, 250, 1)', // rgba for #122846
                                '& .MuiSlider-rail': {
                                    background: `linear-gradient(to right, green ${passedPercentage}%, #ffffff ${passedPercentage}%)`
                                },
                            }}
                        />
                    </div>
                )}
            </div>
            {src && !error && !loading && (
                <div className="w-full flex flex-col items-center mt-5">
                    <div className="flex w-full items-center justify-between mt-2">
                        <div className='flex items-center gap-10'>
                            <FormControl className="">
                                <InputLabel id="playback-rate-label !text-white">Speed</InputLabel>
                                <Select
                                    labelId="playback-rate-label"
                                    value={playbackRate}
                                    onChange={handleSpeedChange}
                                    label="Playback Speed"
                                    color="primary.white" 
                                    className="shadow-lg !px-0 w-24 bg-main-400"
                                >
                                    <MenuItem value={0.25}>0.25x</MenuItem>
                                    <MenuItem value={0.5}>0.5x</MenuItem>
                                    <MenuItem value={1}>1x</MenuItem>
                                    <MenuItem value={1.5}>1.5x</MenuItem>
                                    <MenuItem value={2}>2x</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        <div>
                            <Button
                                ref={playButtonRef}
                                onClick={handlePlayPause}
                                color="primary.light"
                                size="large"
                                className='!rounded-full !w-10 !h-16 !bg-main-400'
                                
                                
                            >
                                {isPlaying ? (
                                    <StopCircleIcon className="text-main-300" fontSize="large" />
                                ) : (
                                    <PlayCircleIcon className="text-main-300" fontSize="large" />
                                )}
                            </Button>
                        </div>
                        <div>
                            <div className='flex items-center gap-0.5'>
                                <Typography className="mr-2 text-sm">
                                    {formatSecomds(Math.floor(currentTime))}/{formatSecomds(Math.floor(duration))}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
})

export default Record;