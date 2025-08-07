import react from 'react';
import { Stage, Layer, Line} from 'react-konva';
import {
    Select,
    MenuItem,
    Typography,
    FormControl,
    InputLabel,
    Button
} from '@mui/material';
import {faPen, faPlus, faEraser} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
import Notification from './components/Notification';
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
    const [lines, setLines] = react.useState({"right":{"entry": [], "exit": []}, "left":{"entry": [], "exit": []}, "through":{"entry": [], "exit": []}});
    const [turnMovementIndication, setTurnMovementIndication] = react.useState("right");
    const [exitOrEntry, setExitOrEntry] = react.useState("entry");
    const isDrawing = react.useRef(false);
    const [tool, setTool] = react.useState('pen'); // 'pen'
    const [videoReady, setVideoReady] = react.useState(false);
    const [videoResolution, setVideoResolution] = react.useState({ width: 1, height: 1 });
    const [videoDisplaySize, setVideoDisplaySize] = react.useState({ width: 1, height: 1 });
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');

    const autoHideDuration = 3000;
    const openNotification = (severity, message) => {
        setSeverity(severity);
        setMessage(message);
        setOpen(true);
    };
    const closeNotification = () => {
        setOpen(false);
    }
    react.useEffect(() => {
        const updateSize = () => {
            if (videoRef.current) {
                const rect = videoRef.current.getBoundingClientRect();
                setVideoDisplaySize({ width: rect.width, height: rect.height });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, [videoRef]);
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
            body: JSON.stringify({ record_id: recordId }),
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching lines:', data.error);
            } else {
                const formattedLines = { right: { entry: [], exit: [] }, left: { entry: [], exit: [] }, through: { entry: [], exit: [] } };
                ['right', 'left', 'through'].forEach(movement => {
                    ['entry', 'exit'].forEach(portal => {
                        const rawPoints = data.lines?.[movement]?.[portal];
                        if (Array.isArray(rawPoints) && rawPoints.length > 0) {
                            for (let index = 0; index < rawPoints.length; index++) {
                                const element = rawPoints[index];
                                // Process each element as needed
                                formattedLines[movement][portal].push({
                                    tool: element.tool || 'pen', // Default to 'pen' if tool is not specified
                                    points: element.points || []
                                });
                            }
                            
                        }
                    });
                });
                console.log('Formatted lines:', formattedLines);
                setLines(formattedLines);
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
        const pos = e.target.getStage().getPointerPosition();
        // Get the width and height of the canvas
        const stage = e.target.getStage();
        const canvasWidth = stage.width();
        const canvasHeight = stage.height();

        if (tool === 'eraser') {
            setLines(prevLines => {
                const updatedLines = [...prevLines[turnMovementIndication][exitOrEntry]];
                // Remove any line where the pointer is near
                const filtered = updatedLines.filter(line => !isPointNearLine(line.points, pos.x/canvasWidth, pos.y/canvasHeight));
                return {
                    ...prevLines,
                    [turnMovementIndication]: {
                        ...prevLines[turnMovementIndication],
                        [exitOrEntry]: filtered
                    }
                };
            });
            return; // Don't start drawing a new line
        }
        isDrawing.current = true;
        setLines(prevLines => {
            const updatedLines = [...prevLines[turnMovementIndication][exitOrEntry]];
            updatedLines.push({ tool, points: [pos.x/canvasWidth, pos.y/canvasHeight] });
            return {
                ...prevLines,
                [turnMovementIndication]: {
                    ...prevLines[turnMovementIndication],
                    [exitOrEntry]: updatedLines
                }
            };
        });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        setLines(prevLines => {
            const currentLines = [...prevLines[turnMovementIndication][exitOrEntry]];

            // Copy the last line and append the new point
            const lastLine = { ...currentLines[currentLines.length - 1] };
            lastLine.points = [...lastLine.points, point.x / stage.width(), point.y / stage.height()];

            // Replace the last line
            currentLines[currentLines.length - 1] = lastLine;

            return {
                ...prevLines,
                [turnMovementIndication]: {
                    ...prevLines[turnMovementIndication],
                    [exitOrEntry]: currentLines
                }
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
    const scaledPointsToPoints = (scaledPoints) => {
        const points = [];
        for (let i = 0; i < scaledPoints.length; i += 2) {
            const element = scaledPoints.slice(i, i + 2);
            element[0] = element[0] / stageRef.current.width();
            element[1] = element[1] / stageRef.current.height();
            points.push(...element);
        }
        return points;
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
        

        const updatedLines = [...lines[turnMovementIndication][exitOrEntry]];
        const lastLine = updatedLines[updatedLines.length - 1];

        updatedLines[updatedLines.length - 1] = lastLine;
        
        setLines({
            ...lines,
            [turnMovementIndication]: {
                ...lines[turnMovementIndication],
                [exitOrEntry]: updatedLines
            }
        });
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

    react.useEffect(() => {

    })

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
                <div className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {videoSrc !== '' ? (
                        <video ref={videoRef} src={videoSrc} className='w-full h-full' onLoadedMetadata={(e) => {
                            setVideoReady(true);
                            const video = e.target;
                            const rect = video.getBoundingClientRect();

                            setVideoResolution({ width: video.videoWidth, height: video.videoHeight });
                            setVideoDisplaySize({ width: rect.width, height: rect.height });
                        }}
                        ></video>
                    ) : (
                        <div className="text-white text-xl">Loading video...</div>
                    )}
                    <div id="canvas" className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <Stage
                            ref={stageRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                pointerEvents: 'auto' // optional if you're not drawing
                            }}
                            width={videoDisplaySize.width}
                            height={videoDisplaySize.height}
                            onMouseDown={handleMouseDown}
                            onMousemove={handleMouseMove}
                            onMouseup={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                            >
                                <Layer>
                                    {lines && lines[turnMovementIndication][exitOrEntry].map((line, i) => (
                                        <Line
                                        key={i}
                                        points={pointsToScaledPoints(line.points)}
                                        stroke="#df4b26"
                                        strokeWidth={5}
                                        tension={0.5}
                                        lineCap="round"
                                        lineJoin="round"
                                        globalCompositeOperation={
                                            line.tool === 'eraser' ? 'destination-out' : 'source-over'
                                        }
                                        />
                                    ))}
                                </Layer>
                        </Stage>
                    </div>
                </div>
                

            </div>
            <div className="flex-1 p-2.5 bg-main-300 h-full flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
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
                    <FormControl className="w-full">
                        <InputLabel id="demo-simple-select-label">Portal</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={exitOrEntry}
                            className='shadow-lg bg-main-400'
                            sx={{
                                color: 'primary.white'
                            }}
                            label="Portal"
                            onChange={(e) => setExitOrEntry(e.target.value)}

                        >   
                            <MenuItem value={'entry'}>
                                <Typography variant="body1" color="textPrimary">
                                    Entry
                                </Typography>
                            </MenuItem>
                            <MenuItem value={'exit'}>
                                <Typography variant="body1" color="textPrimary">
                                    Exit
                                </Typography>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <div className="flex items-center gap-2.5">
                    <FormControl className="w-full">
                        <InputLabel id="demo-simple-select-label">Movement</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={turnMovementIndication}
                            className='shadow-lg bg-main-400'
                            sx={{
                                color: 'primary.white'
                            }}
                            label="Movement"
                            onChange={(e) => setTurnMovementIndication(e.target.value)}

                        >   
                            <MenuItem value={'through'}>
                                <Typography variant="body1" color="textPrimary">
                                    Through Movement
                                </Typography>
                            </MenuItem>
                            <MenuItem value={'left'}>
                                <Typography variant="body1" color="textPrimary">
                                    Left Turn
                                </Typography>
                            </MenuItem>
                            <MenuItem value={'right'}>
                                <Typography variant="body1" color="textPrimary">
                                    Right Turn
                                </Typography>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <div className='flex justify-between items-center'>
                    <Button
                    className='!bg-green-500 shadow-lg hover:!bg-main-400 !text-black'
                    onClick={sendLines}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Button>
                    <Button
                    className='!bg-green-500 shadow-lg hover:!bg-main-400 !text-black'
                    onClick={() => {
                        setLines({"right":{"entry": [], "exit": []}, "left":{"entry": [], "exit": []}, "through":{"entry": [], "exit": []}});
                        setTurnMovementIndication("right");
                        setExitOrEntry("entry");
                    }}
                    >
                        {/* <FontAwesomeIcon icon={faPlus} /> */}
                        <Typography variant="body1" color="textPrimary">
                            Clear
                        </Typography>
                    </Button>
                </div>
            </div>
            <Notification open={open} severity={severity} message={message} onClose={closeNotification} autoHideDuration={autoHideDuration} />
        </div>
        
    );
};

export default AutoCounter;