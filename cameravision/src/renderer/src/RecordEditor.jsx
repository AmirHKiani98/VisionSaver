import "./assets/main.css";
import react from 'react';
import {
    Button,
    Divider,
    Chip,
    TextField
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Notification from './components/Notification';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';

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
    const [newNote, setNewNote] = react.useState("");
    const [notes, setNotes] = react.useState([]);
    const leftTurnButtonRef = react.useRef(null);
    const rightTurnButtonRef = react.useRef(null);
    const throughButtonRef = react.useRef(null);
    const approacButtonRef = react.useRef(null);
    const videoRef = react.useRef(null);
    const [allTurns, setAllTurns] = react.useState([]);
    const [pendingSeekTime, setPendingSeekTime] = react.useState(null);
    react.useEffect(() => {
        if (!allTurns || allTurns.length === 0) {
            setLeftTurns(0);
            setRightTurns(0);
            setThroughTurns(0);
            setApproach(0);
            return;
        }
        const leftCount = allTurns.filter(turn => turn.turn_movement === "left").length;
        setLeftTurns(leftCount);
        const rightCount = allTurns.filter(turn => turn.turn_movement === "right").length;
        setRightTurns(rightCount);
        const throughCount = allTurns.filter(turn => turn.turn_movement === "through").length
        setThroughTurns(throughCount);
        const approachCount = allTurns.filter(turn => turn.turn_movement === "approach").length
        setApproach(approachCount);
    }, [allTurns]);

    const navigate = useNavigate();
    react.useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    const ajaxKeyDown = (turn) => {
        const currentTime = videoRef.current?.getCurrentTime?.() ?? 0;
        const floorCurrentTime = Math.floor(currentTime);
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.ADD_RECORD_TURN_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                record_id: recordId,
                time: floorCurrentTime,
                turn: turn
            })
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    openNotification('error', data.error);
                } else {
                    console.log("data", data, "turn_movement", turn);
                    setAllTurns(prev => [...prev, {
                        id: data.log_id,
                        time: floorCurrentTime,
                        turn_movement: turn
                    }]);
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
        if (!env) return;
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_NOTES}/${recordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    openNotification('error', data.error);
                } else {
                    console.log("data", data);
                    if (data.notes && data.notes.length > 0) {
                        setNotes(data.notes);
                    }
                }
            })
    }, [env]);

    const addRecordNote = (note) => {
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.ADD_RECORD_NOTE_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                record_id: recordId,
                note: note
            })
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    openNotification('error', data.error);
                } else {
                    console.log("data", data);
                    setNotes(prev => [...prev, {
                        id: data.note_id,
                        time: data.time,
                        note: note
                    }]);
                    openNotification('success', 'Note added successfully.');
                }
            })
    }

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


    

    const recordFinishedHandler = () => {
        if (!env) return;
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.SET_RECORD_FINISHED_STATUS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                record_id: recordId,
                finished_counting: true
            })
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    openNotification('error', data.error);
                } else {
                    openNotification('success', 'Record marked as finished successfully.');
                    navigate(-1);
                }
            })
            .catch(error => {
                openNotification('error', `Error marking record as finished: ${error.message}`);
            });
        }


    return (
        <div className="relative w-screen h-screen flex overflow-hidden">
            <div className="absolute top-10 left-10 z-10">
                <Button onClick={() => {
                    navigate(-1);
                }}>
                    Back
                </Button>
            </div>
            <div className="absolute w-screen h-screen flex overflow-hidden">

                <div className="flex flex-1 w-3/4 flex-col justify-between bg-main-600 p-20">
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
                <div className="flex flex-col bg-main-300 py-2 max-w-72">
                    <div>
                        <Divider textAlign="left" sx={{
                            "&::before, &::after": {
                                borderColor: "secondary.light",
                            },
                        }}>
                            <Chip label="Record Logs" className="!bg-main-400 !text-white !font-bold" />
                        </Divider>
                    </div>

                    <div className="flex flex-col">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 p-5">
                            <TextField
                                id="outlined-number"
                                type="number"
                                disabled
                                className="bg-blue-400 rounded-md"
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
                                disabled
                                className="bg-red-400 rounded-md"
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
                                disabled
                                className="bg-yellow-400 rounded-md"
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
                                disabled
                                className="bg-green-400 rounded-md"
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
                                    className="!bg-green-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
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
                                    className="!bg-blue-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
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
                                    className="!bg-yellow-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setThroughTurns(throughTurns + 1);
                                        ajaxKeyDown('through');
                                        // openNotification("success", "Right turn incremented successfully.");
                                    }}
                                    ref={throughButtonRef}
                                >
                                    <ArrowDropDownIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Through
                                    </Typography>
                                </Button>
                                <Button
                                    className="!bg-red-400 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600 flex flex-col shadow-lg"
                                    onClick={() => {
                                        setRightTurns(rightTurns + 1);
                                        ajaxKeyDown('right');
                                        // openNotification("success", "Through incremented successfully.");
                                    }}
                                    ref={rightTurnButtonRef}
                                >
                                    <ArrowRightIcon />
                                    <Typography style={{ fontSize: "7px" }} >
                                        Right
                                    </Typography>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col gap-2">
                            <Divider textAlign="left" sx={{
                                "&::before, &::after": {
                                    borderColor: "secondary.light",
                                },
                            }}>
                                <Chip label="Notes" className="!bg-main-400 !text-white !font-bold" />
                            </Divider>
                            <div className="w-full p-5 gap-5 flex flex-col">
                                { notes && notes.length > 0 ? (
                                    notes.map((note, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-200 p-2 rounded-md mb-2">
                                            <Typography className="text-gray-700">{note.note}</Typography>
                                            <Typography className="text-gray-500 text-xs">{new Date(note.time * 1000).toLocaleString()}</Typography>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 text-center">No notes available.</div>
                                )}
                                <TextField
                                    variant="outlined"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="w-full bg-main-400 rounded-lg text-white"
                                    multiline
                                    focused
                                    rows={3}
                                    label={<Typography className="text-white">Duration (minutes)</Typography>}
                                    
                                />
                                <div className="flex justify-between items-center">
                                    <Button className="!bg-blue-500 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600"
                                    onClick={() => {
                                        if (newNote.trim() === "") {
                                            openNotification("error", "Note cannot be empty.");
                                            return;
                                        }
                                        addRecordNote(newNote);
                                        setNewNote("");
                                    }}
                                    >
                                        
                                        <AddIcon />
                                    </Button>
                                    <Button className="!bg-green-500 !text-white !font-bold hover:!bg-main-500 active:!bg-main-600"
                                    onClick={recordFinishedHandler}
                                    >
                                        
                                        <CheckIcon />
                                    </Button>
                                </div>
                                
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