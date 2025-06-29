import "./assets/main.css";
import { useState, useEffect } from "react";

// Material Tailwind
import { Button } from "@material-tailwind/react";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faClockRotateLeft, faRecordVinyl, faNetworkWired } from "@fortawesome/free-solid-svg-icons";

// MUI - Pickers
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";


// MUI - Core
import {
  TextField,
  Select,
  MenuItem,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemButton,
  InputLabel,
  FormControl,
  IconButton,
  Pagination,
  Link,
  Tooltip
} from "@mui/material";

import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import Vision from "./components/Vision"; // Assuming Vision is a component that displays video streams
import VisionContainer from "./components/VisionContainer";

import Notification from "./components/Notification";
const today = dayjs();
const oneHourFromNow = today.add(1, 'hour');

function App() {
  const [time, setTime] = useState(oneHourFromNow);
  const [protocol, setProtocol] = useState("");
  const [ip, setIp] = useState("");
  const [channel, setChannel] = useState("");
  const [cleared, setCleared] = useState(false);
  const [visions, setVisions] = useState([]);
  const [severity, setSeverity] = useState("info");
  const [message, setMessage] = useState("Note archived");
  const [open, setOpen] = useState(false);
  const streams = [1, 2, 3, 4];
  const [env, setEnv] = useState({});
  useEffect(() => {
    window.env.get().then(setEnv);
    console.log("Environment variables loaded:", env);
  }, []);
  const closeNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  const openNotification = (severity, message) => {

    setSeverity(severity);
    setMessage(message);
    setOpen(true);
  }
  
  const addStreamHandler = (e) => {
    e.preventDefault();
    if (!protocol) {
      openNotification("error", "Please select a protocol (RTSP, HTTP, or HTTPS).");
      return;
    }
    if (!ip) {
      openNotification("error", "Please enter a valid IP address.");
      return;
    }
    if (!channel) {
      openNotification("error", "Please enter a valid channel.");
      return;
    }
    const protocolLower = protocol.toLowerCase();
    const cameraUrl = `${protocolLower}://${ip}/${channel}`
    const streamUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/rtsp/${env.STREAM_FUNCTION_NAME}/?url=${cameraUrl}`;
    console.log("Stream URL:", streamUrl);
    const newVisionInfo = {
      src: streamUrl,
      id: `camera-${Date.now()}`,
      onRemove: onRemoveStream,
    };
    setVisions((prev) => [...prev, newVisionInfo]);
    setProtocol("");
    setIp("");
    setChannel("");
    openNotification("success", "Camera stream added.");
  }

  const removeStreamHandler = (id) => {
    setVisions((prev) => prev.filter(vision => vision.id !== id));
    openNotification("success", "Camera stream deleted.");
  }
  
  const onRemoveStream = (id) => {
    if (id) {
      removeStreamHandler(id);
    } else {
      openNotification("error", "No camera stream ID found.");
    }

  }
  
  return (
    <>
    <div className="min-h-full min-w-full flex p-5">
      <div className="text-white flex flex-col w-full items-center gap-7">
        <h1 className="text-2xl font-bold">Vision Camera Saver</h1>
        <div className="flex w-full gap-10">
          <div className="flex flex-col w-1/2 gap-5">
            <form id="camera-stream-form" className="flex flex-col justify-between w-full" action="#">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FormControl>  
                    <InputLabel id="protocol-select-label">
                      <Typography className="text-white">Protocol</Typography>
                    </InputLabel>
                    <Select labelId="protocol-select-label" id="select-protocol" color="primary.white" className="shadow-lg !py-0 w-32 bg-main-400"  value={protocol} sx={{
                      color: "primary.white"
                    }} onChange={(e) => setProtocol(e.target.value)}>
                      <MenuItem value="RTSP">RTSP</MenuItem>
                      <MenuItem value="HTTP">HTTP</MenuItem>
                      <MenuItem value="HTTPS">HTTPS</MenuItem>
                    </Select>
                  </FormControl>
                  <p className="text-xl">://</p>
                  <TextField value={ip} variant="outlined" className="bg-main-400 rounded-md w-40" focused label={<Typography className="text-white">IP</Typography>} onChange={(e) => setIp(e.target.value)}/>
                  <p className="text-xl">/</p>
                  <TextField value={channel} className="bg-main-400 rounded-md w-24" focused label={<Typography className="text-white">Channel</Typography>} variant="outlined" onChange={(e) => setChannel(e.target.value)} />
                </div>
                <div className="flex gap-5">
                  <Tooltip title="Add Camera Stream" placement="top">
                    <Button id="submit-camera"
                      onClick={addStreamHandler}
                      className="bg-main-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700">
                      <FontAwesomeIcon icon={faVideo} className="text-white" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              
            </form>
            <div className="flex flex-col justify-between col-span-2 w-full gap-2.5">
              <div className="flex gap-2.5">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            className="bg-main-400 rounded-md w-1/2"
                            color="primary.white"
                            label={
                              <Typography className="text-white">Start Date</Typography>
                            }
                            slotProps={{
                              field: { clearable: true, onClear: () => setCleared(true) },
                            }}
                            minDate={today}
                            value={time}
                            onChange={(newValue) => {
                              if (newValue) {
                                setTime(newValue.hour(time.hour()).minute(time.minute()));
                              }
                            }}
                          />
                          <TimePicker
                            className="bg-main-400 w-1/2 rounded-md"
                            label={<Typography className="text-white">Start Time</Typography>}
                            
                            value={time}
                            onChange={setTime}
                            disablePast
                          />
                        </LocalizationProvider>
                
              </div>
              <div className="flex justify-between items-center gap-2.5">
                  <Tooltip title="Start Recording Right Away" placement="right">
                    <Button id="submit-start-recording"
                      className="bg-red-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-red-700">
                      <FontAwesomeIcon icon={faRecordVinyl} />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Add Cron Job for Recording" placement="top">
                    <Button id="submit-add-cronjob"
                      className="bg-yellow-600 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-yellow-700">
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                    </Button>
                  </Tooltip>
                </div>
            </div>
            <Divider textAlign="left"  sx={{
                "&::before, &::after": {
                  borderColor: "secondary.light",
                },
              }}>
              <Chip label="Cronjobs" className="!bg-main-400 !text-white !font-bold" />
            </Divider>
            <List>
              {streams.map((num, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === streams.length - 1;
                let roundedClass = "";
                if (isFirst) roundedClass += " rounded-t-md";
                if (isLast) roundedClass += " rounded-b-md";
                return (
                  <ListItem className={`!bg-main-500 hover:!bg-main-700 shadow-xl overflow-hidden${roundedClass}`} key={num} disablePadding secondaryAction={
                    <Tooltip title="Delete Camera Stream" placement="top">
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon color="secondary" />
                      </IconButton>
                    </Tooltip>
                  }>
                    <Link className="w-full h-full" href="/editor">
                      <ListItemButton >
                        <div className="flex flex-col">
                          <Typography className="text-white">192.168.1.{num}</Typography>
                          <Typography className="text-gray-400">time</Typography>
                        </div> 
                      </ListItemButton>
                    </Link>
                  </ListItem>
                );
              })}
            </List>
            <div className="flex justify-center p-2.5">
              <Pagination 
                count={10} 
                shape="rounded" 
                color="primary" 
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#fff', // Set text color to white
                  },
                  '& .Mui-selected': {
                    color: '#fff', // Selected page number
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiPaginationItem-ellipsis': {
                    color: '#fff', // Ellipsis color
                  },
                }}
              />
            </div>
            
          </div>
          {visions && visions.length > 0 ? (
            <VisionContainer>
              {visions.map((visionProps, idx) => (
                <Vision key={idx} {...visionProps} />
              ))}
            </VisionContainer>
          ) : (
            <div id="no-camera-alert" className="w-full h-full col-span-2 bg-main-700 rounded-lg shadow-lg flex items-center justify-center ">
              <p className="text-white text-center">No video stream selected</p>
            </div>
          )}
        </div>
      </div>
      </div>
      <Notification
        open={open}
        severity={severity}
        message={message}
        onClose={closeNotification}
      />
    </>
  )
}

export default App
