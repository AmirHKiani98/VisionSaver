import "./assets/main.css";
import react from 'react';
import {
    CircularProgress,
    Button,
    Link,
    Divider,
    Chip,
    TextField
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ContextMenu from './components/ContextMenu';
import Notification from './components/Notification';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';


function useQuery() {
    return new URLSearchParams(useLocation().search);
}
import Record from './components/Record';
import { Typography } from "@material-tailwind/react";
const RecordEditor = (props) => {
    
    const [env, setEnv] = react.useState(props.env || null);
    const query = useQuery();
    const recordIdParam = query.get('record_id');
    const recordId = recordIdParam ? recordIdParam.split('?')[0] : null;
    const token = query.get('token');
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');
    const [leftTurns, setLeftTurns] = react.useState(0);
    const [rightTurns, setRightTurns] = react.useState(0);
    const [throughTurns, setThroughTurns] = react.useState(0);
    const [approach, setApproach] = react.useState(0);
    const leftTurnButtonRef = react.useRef(null);
    const rightTurnButtonRef = react.useRef(null);
    const throughButtonRef = react.useRef(null);
    const approacButtonRef = react.useRef(null);
    const videoRef = react.useRef(null);
    const [allTurns, setAllTurns] = react.useState([]);
    const [pendingSeekTime, setPendingSeekTime] = react.useState(null);


    const navigate = useNavigate();
    react.useEffect(() => {
            window.env.get().then(setEnv);
    }, []);



    const closeNotification = () => {
        // setOpen(false);
        // setSeverity('info');
        // setMessage('');
    }
    const ajaxKeyDown = (turn) => {
        const currentTime = videoRef.current?.getCurrentTime?.() ?? 0;
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.ADD_RECORD_TURN_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            
            body: JSON.stringify({
                record_id: recordId,
                time: Math.floor(currentTime),
                turn: turn
            })
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                openNotification('success', `${turn.charAt(0).toUpperCase() + turn.slice(1)} incremented successfully.`);
            }
        })
    }
    react.useEffect(() => {
        if (!env) return; // Prevent fetch until env is loaded
        if (!videoRef.current) return; // Prevent fetch until videoRef is set
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_TURN_URL}/${recordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                let checkpoint = Number(data.checkpoint);
                let videoDuration = Number(data.video_duration);

                setPendingSeekTime(checkpoint)
                console.log("data", data);
                if (data.turns && data.turns.length > 0) {
                    for (const turn of data.turns) {
                        if(turn.turn_movement === "left"){
                            setLeftTurns(prev => prev + 1);
                        }
                        else if(turn.turn_movement === "right"){
                            setRightTurns(prev => prev + 1);
                        }
                        else if(turn.turn_movement === "through"){
                            setThroughTurns(prev => prev + 1);
                        }
                        else if(turn.turn_movement === "approach"){
                            setApproach(prev => prev + 1);
                        }
                        setAllTurns(prev => [...prev, turn]);
                    
                    }
                }
            }
        })
        .catch(error => {
            openNotification('error', `Error fetching record logs: ${error.message}`);
        });
    }, [recordId, env, videoRef]);

    react.useEffect(() => {
        const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp':
            approacButtonRef.current?.click();
            break;
            case 'ArrowDown':
            throughButtonRef.current?.click();
            break;
            case 'ArrowLeft':
            leftTurnButtonRef.current?.click();
            break;
            case 'ArrowRight':
            rightTurnButtonRef.current?.click();
            break;
            default:
            break;
        }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup event listener on component unmount
        return () => {
        window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    let lastTime = null;

    const getCurrentTimestamp = () => {
        return Math.floor(Date.now() / 1000);
    };
    lastTime = getCurrentTimestamp();
    const [currentTime, setCurrentTime] = react.useState(getCurrentTimestamp());

    
    react.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime((prevTime) => {
                const newTime = getCurrentTimestamp();
                if (newTime - lastTime > 3) {
                    lastTime = newTime;
                    setOpen(false);
                    setSeverity('info');
                    setMessage('');
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const openNotification = (severity, message) => {
        

        if (open) {
            setSeverity(severity);
            setMessage(message);
        } else {
            setOpen(true);
            setSeverity(severity);
            setMessage(message);
        }
    };




    

    return (
        <div className="relative w-screen h-screen flex overflow-hidden">
            <div className="absolute top-10 left-10 z-10">
                <Button onClick={() =>{
                    navigate(-1);
                }}>
                    Back
                </Button>
            </div>
            <div className="absolute w-screen h-screen flex overflow-hidden">
                
                <div className="flex w-3/4 flex-col justify-between bg-main-600 p-20">
                    <div></div>
                    <Record
                        id={recordId}
                        recordId={recordId}
                        ref={videoRef}
                        pendingSeekTime={pendingSeekTime}
                        logs={allTurns}
                        setLogs={setAllTurns} // Pass setter to allow Record to update allTurns
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center bg-main-300 py-2">
                    <div>
                        <Divider textAlign="right"  sx={{
                            "&::before, &::after": {
                                borderColor: "secondary.light",
                            },
                        }}>
                            <Chip label="Record Logs" className="!bg-main-400 !text-white !font-bold" />
                        </Divider>
                    </div>
                    <div className="flex flex-col items-center justify-between flex-1">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 p-5">
                            <TextField
                                id="outlined-number"
                                type="number"
                                className="bg-main-400 rounded-md"
                                slotProps={{
                                    inputLabel: {
                                    shrink: true,
                                    },
                                }}
                                value={leftTurns ?? 0}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= 0) {
                                        setLeftTurns(value);
                                    } else {
                                        openNotification("error", "Value must be a positive number.");
                                    }
                                    }}
                                    label={<Typography className="text-white">Left Turns</Typography>}
                                />
                                <TextField
                                    id="outlined-number"
                                    type="number"
                                    className="bg-main-400 rounded-md"
                                    slotProps={{
                                        inputLabel: {
                                        shrink: true,
                                        },
                                    }}
                                    value={rightTurns ?? 0}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value >= 0) {
                                            setRightTurns(value);
                                        } else {
                                            openNotification("error", "Value must be a positive number.");
                                        }
                                        }}
                                        label={<Typography className="text-white">Right Turns</Typography>}
                                />
                                <TextField
                                    id="outlined-number"
                                    type="number"
                                    className="bg-main-400 rounded-md"
                                    slotProps={{
                                        inputLabel: {
                                        shrink: true,
                                        },
                                    }}
                                    value={throughTurns ?? 0}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value >= 0) {
                                            setThroughTurns(value);
                                        } else {
                                            openNotification("error", "Value must be a positive number.");
                                        }
                                        }}
                                        label={<Typography className="text-white">Through</Typography>}
                                />
                                <TextField
                                    id="outlined-number"
                                    type="number"
                                    className="bg-main-400 rounded-md"
                                    slotProps={{
                                        inputLabel: {
                                        shrink: true,
                                        },
                                    }}
                                    value={approach ?? 0}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value >= 0) {
                                            setApproach(value);
                                        } else {
                                            openNotification("error", "Value must be a positive number.");
                                        }
                                        }}
                                        label={<Typography className="text-white">Approach</Typography>}
                                />
                        </div>
                        <div className="flex flex-col items-center gap-2.5 p-5">
                            <div className="flex justify-center items-center">
                                <Button 
                                    className="!bg-main-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setApproach(approach + 1);
                                        ajaxKeyDown('approach');
                                        // openNotification("success", "Approach incremented successfully.");
                                    }}
                                    ref={approacButtonRef}
                                >
                                    <ArrowDropUpIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Approach
                                    </Typography>
                                </Button>
                            </div>
                            <div className="flex justify-center items-start gap-2.5">
                                <Button 
                                    className="!bg-main-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setLeftTurns(leftTurns + 1);
                                        ajaxKeyDown('left');
                                        // openNotification("success", "Left turn incremented successfully.");
                                    }}
                                    ref={leftTurnButtonRef}
                                >
                                    <ArrowLeftIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Left
                                    </Typography>
                                </Button>
                                <Button 
                                    className="!bg-main-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setRightTurns(rightTurns + 1);
                                        ajaxKeyDown('right');
                                        // openNotification("success", "Right turn incremented successfully.");
                                    }}
                                    ref={rightTurnButtonRef}
                                >
                                    <ArrowDropDownIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Through
                                    </Typography>
                                </Button>
                                <Button 
                                    className="!bg-main-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setThroughTurns(throughTurns + 1);
                                        ajaxKeyDown('through');
                                        // openNotification("success", "Through incremented successfully.");
                                    }}
                                    ref={throughButtonRef}
                                >
                                    <ArrowRightIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Right
                                    </Typography>
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            <Notification
                open={open}
                severity={severity}
                message={message}
            />
        </div>

    )

}

export default RecordEditor;