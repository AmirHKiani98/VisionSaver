import "./assets/main.css";
import React from 'react';
import { Button, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
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

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[800px] bg-main-500 shadow-2xl p-10 rounded-lg flex flex-col gap-5 max-h-[80vh]">
            <Typography className="!text-xl !font-bold text-white">
                Import Record
            </Typography>
            <div className="flex flex-col gap-5">
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    variant="contained"
                    className="bg-main-400 hover:bg-main-300 text-white"
                >
                    <FontAwesomeIcon icon={faCloudArrowDown} className="text-white" />
                    <VisuallyHiddenInput
                        type="file"
                        accept="video/*"
                        onChange={(event) => {
                            const files = Array.from(event.target.files || []);
                            const urls = files.map(file => URL.createObjectURL(file));
                            setVideos(urls);
                        }}
                        multiple
                    />
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
                                    // handle changes from VideoInput if needed
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
export default ImportComponent;