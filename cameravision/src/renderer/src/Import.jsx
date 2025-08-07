import "./assets/main.css";
import React from 'react';
import { Button, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import VideoInput from "./components/VideoInput";
// import { openNotification } from './components/Notification';
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImportComponent = () => {
    const [times, setTimes] = React.useState([]);
    const [urls, setURLs] = React.useState([]);
    const [duration, setDuration] = React.useState(0);
    const today = dayjs().startOf('day');
    const [cleared, setCleared] = React.useState(false);
    const [videos, setVideos] = React.useState([]);
    const [videoInputs, setVideoInputs] = React.useState([]);
    const [env, setEnv] = React.useState({});

    React.useEffect(() => {
        // Get the env
        window.env.get().then(setEnv)
    }, []);
    const uploadVideos = () => {
        const randomString = Array.from({ length: 100 }, () => Math.random().toString(36)[2]).join('')
        const uploadUrl = `${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.IMPORT_VIDEO_URL}`;
    }
    // When you add videos, also initialize videoInputs:
    const handleFiles = (event) => {
        const files = Array.from(event.target.files || []);
        const urls = files.map(file => URL.createObjectURL(file));
        setURLs(prev => [...prev, ...urls]);
        setVideos(prev => [...prev, ...urls]);
        setVideoInputs(prev => [
            ...prev,
            ...urls.map(() => ({ ip: '', time: null, duration: 0 }))
        ]);
    };

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[800px] bg-main-500 shadow-2xl p-10 rounded-lg flex flex-col gap-5 max-h-[80vh] overflow-auto">
            <Typography className="!text-xl !font-bold text-white">
                Import Record
            </Typography>
            <div className="flex flex-row justify-between items-center">
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    variant="contained"
                    className="!bg-main-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                >
                    <FontAwesomeIcon icon={faCloudArrowDown} className="text-white" />
                    <VisuallyHiddenInput
                        type="file"
                        accept="video/*"
                        onChange={handleFiles}
                        multiple
                    />
                </Button>
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    disabled={videos.length === 0}
                    variant="contained"
                    onClick={() => {
                        
                    }}
                    className="!bg-green-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                >
                    <FontAwesomeIcon icon={faCheck} className="text-white" />
                    
                </Button>
            </div>
            <div className="flex flex-row gap-5 justify-between items-center">
                <div className="grid grid-cols-1 gap-4">
                    {videos.map((videoSrc, index) => (
                        <div className="flex flex-col gap-2" key={index}>
                            <video
                                src={videoSrc}
                                controls
                                className="rounded-md border border-white"
                            />
                            <VideoInput
                                onChange={({ ip, time, duration }) => {
                                    setVideoInputs(inputs => {
                                        const updated = [...inputs];
                                        updated[index] = { ip, time, duration };
                                        return updated;
                                    });
                                }}
                                value={videoInputs[index] || { ip: '', time: null, duration: 0 }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
export default ImportComponent;