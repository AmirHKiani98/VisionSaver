import react from 'react';
import { Stage, Layer, Line} from 'react-konva';
import {
    Select,
    MenuItem,
    Typography,
    FormControl,
    InputLabel,
    Button,
    TextField,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {faPen, faPlus, faEraser, faUpload, faRefresh} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
import Notification from './components/Notification';
import LinearProgressWithLabel from './components/LinearProgressWithLabel';
import Video from './components/Video';
import VideoSlider from './components/VideoSlider';
import PlayStop from './components/PlayStop';
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
const AutoCounter = () => {
    const query = useQuery();
    const recordIdParam = query.get('record_id');
    const recordId = recordIdParam ? recordIdParam.split('?')[0] : null;
    const [videoSrc, setVideoSrc] = react.useState('');
    const [pendingSeekTime, setPendingSeekTime] = react.useState(null);
    const stageRef = react.useRef(null);
    const [env, setEnv] = react.useState(null);
    const videoRef = react.useRef(null);
    const [lines, setLines] = react.useState({});
    const [portal, setPortal] = react.useState("");
    const isDrawing = react.useRef(false);
    const [tool, setTool] = react.useState('pen'); // 'pen'
    const [videoReady, setVideoReady] = react.useState(false);
    const [videoResolution, setVideoResolution] = react.useState({ width: 1, height: 1 });
    const [videoDisplaySize, setVideoDisplaySize] = react.useState({ width: 1, height: 1 });
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');
    const [portalInput, setPortalInput] = react.useState('');
    const [selectedPortal, setSelectedPortal] = react.useState('');
    const [counterActivated, setCounterActivated] = react.useState(false);
    const [progress, setProgress] = react.useState(0);
    const [currentTime, setCurrentTime] = react.useState(0);
    const [duration, setDuration] = react.useState(0);
    const [seeking, setSeeking] = react.useState(false);
    const [countDict, setCountDict] = react.useState({});



    const autoHideDuration = 3000;
    const openNotification = (severity, message) => {
        setSeverity(severity);
        setMessage(message);
        setOpen(true);
    };
    const containerRef = react.useRef(null);
    const [containerSize, setContainerSize] = react.useState({ width: 0, height: 0 });

    react.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
        const cr = entry.contentRect;
        setContainerSize({ width: cr.width, height: cr.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
    }, []);
    const closeNotification = () => {
        setOpen(false);
    }
    react.useEffect(() => {
        if (!videoRef.current) return;
        const videoElem = videoRef.current;
        const updateSize = () => {
            const rect = videoElem.getBoundingClientRect();
            setVideoDisplaySize({ width: rect.width, height: rect.height });
        };
        // Initial update
        updateSize();
        // Use ResizeObserver for dynamic layout changes
        const resizeObserver = new window.ResizeObserver(updateSize);
        resizeObserver.observe(videoElem);
        // Also listen to window resize for safety
        window.addEventListener('resize', updateSize);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, [videoRef]);

    react.useEffect(() => {
        if (!env) return;
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_RECORD_AUTOCOUNTS}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ record_id: recordId }),
            }
        )
        .then(response => response.json())
        .then(data => {
            if (data && data.counts) {
                const autoCounts = data.counts;
                setCountDict(autoCounts);
            } else {
            }
        })
    }, [env, recordId]);

    react.useEffect(() => {
        if (!env || !videoReady) return;
        if (!recordId) {
            console.error('No record ID provided in the URL');
            return;
        }
        fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_GET_LINES}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ record_id: recordId, divide_time: 0.1 }),
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching lines:', data.error);
            } else {
                console.log('Fetched lines:', data.lines);
                setLines(data.lines);
            }
        })

    }, [env, videoReady]);
    const sendLines = () => {
        if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT) {
            console.error('Environment variables not set');
            return;
        }
        const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_ADD_LINES}`;
        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                record_id: recordId,
                lines: lines,
            }),
        })
        .then(response => response.json())
        .then(data => {
            openNotification('success', 'Lines sent successfully');
        })
        .catch(error => {
            openNotification('error', 'Error sending lines');
        });
    }

    const handleMouseDown = (e) => {
        if (selectedPortal === '') {
            openNotification('error', 'Please select a portal first');
            return;
        }
        const pos = e.target.getStage().getPointerPosition();
        const stage = e.target.getStage();
        const canvasWidth = stage.width();
        const canvasHeight = stage.height();

        if (tool === 'eraser') {
            setLines(prevLines => {
                const updatedLines = [...(prevLines[selectedPortal] || [])];
                const filtered = updatedLines.filter(line => !isPointNearLine(line.points, pos.x/canvasWidth, pos.y/canvasHeight));
                return {
                    ...prevLines,
                    [selectedPortal]: filtered
                };
            });
            return;
        }
        isDrawing.current = true;
        setLines(prevLines => {
            const updatedLines = [...(prevLines[selectedPortal] || [])];
            // Start a new line with the first point
            updatedLines.push({ tool, points: [pos.x / canvasWidth, pos.y / canvasHeight] });
            return {
                ...prevLines,
                [selectedPortal]: updatedLines
            };
        });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        setLines(prevLines => {
            const currentLines = [...(prevLines[selectedPortal] || [])];
            if (currentLines.length === 0) return prevLines; // nothing to update

            // Add the new point to the last line
            const lastLine = { ...currentLines[currentLines.length - 1] };
            lastLine.points = [...lastLine.points, point.x / stage.width(), point.y / stage.height()];
            currentLines[currentLines.length - 1] = lastLine;

            return {
                ...prevLines,
                [selectedPortal]: currentLines
            };
        });
    };
    const pointsToScaledPoints = (points) => {
        const scaledPoints = [];
        for (let i = 0; i < points.length; i += 2) {
            const element = points.slice(i, i + 2);
            element[0] = element[0] * stageRef.current.width()
            element[1] = element[1] * stageRef.current.height();
            scaledPoints.push(...element);
        }
        return scaledPoints;
    };

    function isPointNearLine(points, x, y, threshold = 0.02) {
        for (let i = 0; i < points.length - 2; i += 2) {
            const x1 = points[i], y1 = points[i + 1];
            const x2 = points[i + 2], y2 = points[i + 3];
            // Distance from point to segment
            const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;
            let xx, yy;
            if (param < 0) { xx = x1; yy = y1; }
            else if (param > 1) { xx = x2; yy = y2; }
            else { xx = x1 + param * C; yy = y1 + param * D; }
            const dx = x - xx, dy = y - yy;
            if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
        }
        return false;
    }

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    react.useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    react.useEffect(() => {
        if (!recordId) {
            console.error('No record ID provided in the URL');
            return;
        }
        if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT) {
            return;
        }
        const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_URL}/${recordId}/`;
        fetch(backendUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data.url) {
                    setVideoSrc(data.url);
                } else {
                    console.error('No video URL found in the response');
                }
            });
    }, [env, recordId]);

    const startCounting = () => {
        if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT) {
            openNotification('error', 'Environment variables not set');
            return;
        }
        const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_START_COUNTING}`;
        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                record_id: recordId,
                lines: lines,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                openNotification('success', 'Counting started successfully');
            }
        })
        .catch(error => {
            openNotification('error', `Error starting counting: ${error.message}`);
        });
    }

    react.useEffect(() => {
        if (!env || !recordId) return;
        const wsUrl = `ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/ws/counter_progress/${recordId}/`;
        const ws = new window.WebSocket(wsUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.progress !== undefined) setProgress(data.progress);
        };
        ws.onclose = () => { /* Optionally handle close */ };
        ws.onerror = (e) => { /* Optionally handle error */ };

        return () => ws.close();
    }, [env, recordId]);

    react.useEffect(() => {
        if (!env) return;
        if (!videoRef.current) return;
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
                    setPendingSeekTime(checkpoint);
                }
            })
            .catch(error => {
                openNotification('error', `Error fetching record logs: ${error.message}`);
            });
    }, [recordId, env, videoRef]);

    react.useEffect(() => {
        if (!recordId) {
            console.error('No record ID provided in the URL');
            return;
        }
    }, [recordId]);

    // Handler for slider change
    const handleSliderChange = (e, value) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value;
        }
        setCurrentTime(value);
    };

    // Handler for video time update
    const handleTimeUpdate = () => {
        if (videoRef.current && !seeking) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Handler for video loadedmetadata
    const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <div className='absolute top-5 left-5 z-10'>
                <Button onClick={() => {
                    window.history.back();
                }
                }>
                    Back
                </Button>
            </div>
            <div className='w-2/3 p-5'>
                <div className='flex items-center justify-between mb-5 gap-2.5'>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={startCounting}
                        className='!bg-main-500 shadow-lg hover:!bg-main-400 !text-black'
                        disabled={Object.keys(lines).length === 0}
                    >
                        Start Counting
                    </Button>
                    {Object.keys(countDict).length == 0 && (
                        <LinearProgressWithLabel value={progress} />
                    )}
                </div>
                <div className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden" ref={containerRef}>
                    {videoSrc ? (
                        <Video
                        ref={videoRef}
                        src={videoSrc}
                        setLoading={setVideoReady}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        style={{ pointerEvents: 'none', width: '100%', height: 'auto', display: 'block' }}
                        />
                    ) : (
                        <div className="text-white text-xl"><CircularProgress /></div>
                    )}

                    {containerSize.width > 0 && containerSize.height > 0 && (
                        <div className="absolute inset-0 z-50">
                        <Stage
                            ref={stageRef}
                            width={containerSize.width}
                            height={containerSize.height}
                            style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                        >
                            <Layer>
                            {lines && lines[selectedPortal] && lines[selectedPortal].map((line, i) => (
                                <Line
                                key={i}
                                points={pointsToScaledPoints(line.points)}
                                stroke="#df4b26"
                                strokeWidth={5}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                                />
                            ))}
                            </Layer>
                        </Stage>
                        </div>
                    )}
                    </div>

                <div className='flex mt-2.5 z-50 gap-5 justify-between items-center'>
                    <VideoSlider
                        value={currentTime}
                        min={0}
                        max={duration}
                        step={0.1}
                        onChange={(e, value) => {
                            console.log('Slider value changed:', value);
                            setSeeking(true);
                            setCurrentTime(value);
                        }}
                        className='flex-1'
                        onChangeCommitted={(e, value) => {
                            setSeeking(false);
                            if (videoRef.current) {
                                videoRef.current.currentTime = value;
                            }
                        }}
                        />
                    <PlayStop
                        videoRef={videoRef}
                        setCurrentTime={setCurrentTime}
                        setSeeking={setSeeking}
                        currentTime={currentTime}
                        duration={duration}
                        setDuration={setDuration}
                        setVideoReady={setVideoReady}
                        pendingSeekTime={pendingSeekTime}
                        setPendingSeekTime={setPendingSeekTime}
                    />
                </div>

            </div>
            <div className="flex-1 p-2.5 bg-main-300 h-full flex flex-col gap-2.5">
                <div className="grid grid-cols-1 gap-5">
                    <FormControl className="w-full">
                        <InputLabel id="demo-simple-select-label">Age</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={tool}
                            className='shadow-lg bg-main-400'
                            sx={{
                                color: 'primary.white'
                            }}
                            label="Drawer"
                            onChange={(e) => setTool(e.target.value)}

                        >
                            <MenuItem value={'pen'}>
                            <Typography variant="body1" color="textPrimary">
                                Pen
                                <FontAwesomeIcon icon={faPen} className="ml-2" />
                            </Typography>
                            
                            </MenuItem>
                            <MenuItem value={'eraser'}>
                                <Typography variant="body1" color="textPrimary">
                                    Eraser
                                    <FontAwesomeIcon icon={faEraser} className="ml-2" />
                                </Typography>
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl className="w-full !flex !flex-row items-center justify-between gap-2.5">
                        <TextField
                            label="Portal Name"
                            variant="outlined"
                            value={portalInput}
                            onChange={(e) => setPortalInput(e.target.value)}
                            className='shadow-lg bg-main-400'
                            sx={{
                                color: 'primary.white'
                            }}
                        />
                        <Button
                            className='!bg-green-500 h-full shadow-lg hover:!bg-main-400 !text-black'
                            onClick={() => {
                                if (portalInput.trim() === '') {
                                    openNotification('error', 'Portal name cannot be empty');
                                    return;
                                }
                                setLines(prevLines => {
                                    const newLines = { ...prevLines, [portalInput]: [] };
                                    setSelectedPortal(portalInput); // Optionally select the new portal
                                    return newLines;
                                });
                                setPortalInput('');
                            }}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </Button>
                    </FormControl>
                    <FormControl className="w-full">
                        <InputLabel id="demo-simple-select-label">Portal</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={selectedPortal}
                            className='shadow-lg bg-main-400 flex'
                            sx={{
                                color: 'primary.white',
                                '& .MuiSelect-select': {
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }
                            }}
                            disabled={Object.keys(lines).length === 0}
                            label="Portal"
                            onChange={(e) => setSelectedPortal(e.target.value)}

                        >   
                            {Object.keys(lines).map((key) => (
                                <MenuItem key={key} value={key} className='!flex !justify-between !items-center'>
                                        <Typography variant="body1" color="textPrimary" className='w-10'>
                                            {key}
                                        </Typography>
                                        <Button
                                            className='!bg-red-500 h-full shadow-lg hover:!bg-main-500 !text-black'
                                            onClick={() => {
                                                // Remove the selected portal and its lines
                                                setLines(prevLines => {
                                                    const newLines = { ...prevLines };
                                                    delete newLines[key];
                                                    if (selectedPortal === key) {
                                                        setSelectedPortal(''); // Clear selection if the deleted portal was selected
                                                    }
                                                    return newLines;
                                                })
                                            }}
                                            >
                                            <FontAwesomeIcon icon={faEraser} className='text-white' />
                                            </Button>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>
                
                <div className='flex justify-between items-center'>
                    <Tooltip title="Send lines to the server">
                        <Button
                        className='!bg-green-500 shadow-lg hover:!bg-main-400 !text-black h-full'
                        onClick={sendLines}
                        >
                            <FontAwesomeIcon icon={faUpload} />
                        </Button>
                    </Tooltip>
                    <Button
                    className='!bg-green-500 shadow-lg hover:!bg-main-400 !text-black'
                    onClick={() => {
                        setLines({});
                        setSelectedPortal('');
                        setPortal("");
                    }}
                    >
                        {/* <FontAwesomeIcon icon={faPlus} /> */}
                        <FontAwesomeIcon icon={faRefresh} />
                    </Button>
                </div>
            </div>
            <Notification open={open} severity={severity} message={message} onClose={closeNotification} autoHideDuration={autoHideDuration} />
        </div>
        
    );
};

export default AutoCounter;