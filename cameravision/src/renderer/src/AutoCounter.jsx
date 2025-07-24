import react from 'react';
import { Stage, Layer, Line, Text} from 'react-konva';
import Video from './components/Video';
import Record from './components/Record';``
import {
    Select,
    MenuItem,
    Typography,
    FormControl,
    InputLabel
} from '@mui/material';
import {faPen, faPencil, faEraser} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
const AutoCounter = () => {
    const query = useQuery();
    const recordIdParam = query.get('record_id');
    const recordId = recordIdParam ? recordIdParam.split('?')[0] : null;
    const [videoSrc, setVideoSrc] = react.useState('');
    const [pendingSeekTime, setPendingSeekTime] = react.useState(null);
    const [env, setEnv] = react.useState(null);
    const videoRef = react.useRef(null);
    const [lines, setLines] = react.useState({"right":{"entry": [], "exit": []}, "left":{"entry": [], "exit": []}, "through":{"entry": [], "exit": []}});
    const [turnMovementIndication, setTurnMovementIndication] = react.useState("right");
    const [exitOrEntry, setExitOrEntry] = react.useState("entry");
    const isDrawing = react.useRef(false);
    const [tool, setTool] = react.useState('pen'); // 'pen'
    const [videoResolution, setVideoResolution] = react.useState({ width: 1, height: 1 });
    const [videoDisplaySize, setVideoDisplaySize] = react.useState({ width: 1, height: 1 });
    
    react.useEffect(() => {
        const updateSize = () => {
            if (videoRef.current) {
                console.log('Updating video display size');
                const rect = videoRef.current.getBoundingClientRect();
                setVideoDisplaySize({ width: rect.width, height: rect.height });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, [videoRef]);

    const handleMouseDown = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        if (tool === 'eraser') {
            setLines(prevLines => {
                const updatedLines = [...prevLines[turnMovementIndication][exitOrEntry]];
                // Remove any line where the pointer is near
                const filtered = updatedLines.filter(line => !isPointNearLine(line.points, pos.x, pos.y));
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
            updatedLines.push({ tool, points: [pos.x, pos.y] });
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
            lastLine.points = [...lastLine.points, point.x, point.y];

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
    function isPointNearLine(points, x, y, threshold = 10) {
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
        const scaleX = videoResolution.width / videoDisplaySize.width;
        const scaleY = videoResolution.height / videoDisplaySize.height;

        const updatedLines = [...lines[turnMovementIndication][exitOrEntry]];
        const lastLine = updatedLines[updatedLines.length - 1];

        const scaledPoints = lastLine.points.map((pt, idx) =>
            idx % 2 === 0
                ? pt * scaleX // X
                : pt * scaleY // Y
        );

        // Save the scaled points to use or export
        console.log('Video pixel coordinates:', scaledPoints);

        // Optional: Save it inside the line if you want to keep both
        lastLine.scaledPoints = scaledPoints;
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
        console.log(`Record ID from URL: ${recordId}`);
    }, [recordId]);

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <div className='w-2/3 p-5'>
                <div className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {videoSrc !== '' ? (
                        <video ref={videoRef} src={videoSrc} className='w-full h-full' onLoadedMetadata={(e) => {
                            const video = e.target;
                            setVideoResolution({ width: video.videoWidth, height: video.videoHeight });
                        }}
                        ></video>
                    ) : (
                        <div className="text-white text-xl">Loading video...</div>
                    )}
                    <div id="canvas" className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50">
                        <Stage
                            className='w-full h-full'
                            width={window.innerWidth}
                            height={window.innerHeight}
                            onMouseDown={handleMouseDown}
                            onMousemove={handleMouseMove}
                            onMouseup={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                            >
                                <Layer>
                                    {lines[turnMovementIndication][exitOrEntry].map((line, i) => (
                                        <Line
                                        key={i}
                                        points={line.points}
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
        </div>
    );
};

export default AutoCounter;