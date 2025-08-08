import { Button } from '@mui/material';
import React from 'react';
import { faStop, faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const PlayStop = ({ 
    videoRef, 
    setCurrentTime,
    setSeeking,
    currentTime,
    duration,
    setDuration,
    setVideoReady,
    pendingSeekTime,
    setPendingSeekTime 
}) => {
    const [isPlaying, setIsPlaying] = React.useState(false);

    const handlePlayStop = () => {
        if (!isPlaying) {
            if (videoRef.current) {
                videoRef.current.play();
                setIsPlaying(true);
            }
        } else {
            if (videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    React.useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(videoRef.current.currentTime);
            });
            
            videoRef.current.addEventListener('loadedmetadata', () => {
                setDuration(videoRef.current.duration);
                setVideoReady(true);
            });
        }
    }, [videoRef]);

    return (
        <div className="play-stop-controls">
            <Button 
                variant="contained" 
                onClick={handlePlayStop} 
            >
                <FontAwesomeIcon icon={isPlaying ? faStop : faPlay} />
            </Button>
        </div>
    );
}

export default PlayStop;