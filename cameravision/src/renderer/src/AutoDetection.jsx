import react from 'react';
import { Stage, Layer, Line, Rect, Text} from 'react-konva';

import {
    Select,
    MenuItem,
    Typography,
    FormControl,
    InputLabel,
    Button,
    TextField,
    CircularProgress,
    Tooltip,
    Divider,
    Chip,
    Switch
} from '@mui/material'; 
import {faPen, faPlus, faEraser, faUpload, faRefresh, faEye, faEyeSlash, faCar, faMagnifyingGlass, faTrash, faCalculator, faStop, faClone, faDirections, faArrowRight, faCircleInfo, faVideoSlash, faChartBar} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useLocation } from 'react-router-dom';

import Notification from './components/Notification';
import LinearProgressWithLabel from './components/LinearProgressWithLabel';
import Video from './components/Video';
import VideoSlider from './components/VideoSlider';
import PlayStop from './components/PlayStop';
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
const AutoDetection = () => {
    const query = useQuery();
    const recordIdParam = query.get('record_id');
    const recordId = recordIdParam ? recordIdParam.split('?')[0] : null;
    const [videoSrc, setVideoSrc] = react.useState('');
    const [pendingSeekTime, setPendingSeekTime] = react.useState(null);
    const stageRef = react.useRef(null);
    const [cutZoneTool, setCutZoneTool] = react.useState('zone'); // 'draw' or 'erase'
    const [env, setEnv] = react.useState(null);
    const videoRef = react.useRef(null);
    const [lines, setLines] = react.useState({});
    const [portal, setPortal] = react.useState("");
    const [detectingStarted, setDetectingStarted] = react.useState(false);
    const isDrawing = react.useRef(false);
    const [tool, setTool] = react.useState('zone');
    const [videoReady, setVideoReady] = react.useState(false);
    const [videoDisplaySize, setVideoDisplaySize] = react.useState({ width: 1, height: 1 });
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');
    const [portalInput, setPortalInput] = react.useState('');
    const [selectedPortal, setSelectedPortal] = react.useState('');
    const [progress, setProgress] = react.useState(0);
    const [currentTime, setCurrentTime] = react.useState(0);
    const [duration, setDuration] = react.useState(0);
    const [seeking, setSeeking] = react.useState(false);
    const [completeDf, setCompleteDf] = react.useState({});
    const [showingDetectionDf, setShowingDetectionDf] = react.useState([]);
    const [showDetections, setShowDetections] = react.useState(false);
    const [detectionExists, setDetectionExists] = react.useState(false);
    const [accuracy, setAccuracy] = react.useState(0.05); // Default accuracy value
    const [detectionVersion, setDetectionVersion] = react.useState('v2');
    const [showModifiedDetections, setShowModifiedDetections] = react.useState(false);
    const [modifiedDetectingExists, setModifiedDetectingExists] = react.useState(false);
    const [modifiedProgress, setModifiedProgress] = react.useState(0);
    const [modifyingDetectionStarted, setModifyingDetectionStarted] = react.useState(false);
    const [maxTimeUpdated, setMaxTimeUpdated] = react.useState(0);
    const [detectionInProcess, setDetectionInProcess] = react.useState(false);
    const [cutZonesEnabled, setCutZonesEnabled] = react.useState(false);
    const [cutZonesPoints, setCutZonesPoints] = react.useState([]);
    
    

    


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
        let lastDevicePixelRatio = window.devicePixelRatio;
        const updateSize = () => {
            const rect = videoElem.getBoundingClientRect();
            setVideoDisplaySize({ width: rect.width, height: rect.height });
        };
        // Initial update
        updateSize();
        // Use ResizeObserver for dynamic layout changes
        const resizeObserver = new window.ResizeObserver(updateSize);
        resizeObserver.observe(videoElem);
        // Listen to window resize and orientationchange
        window.addEventListener('resize', updateSize);
        window.addEventListener('orientationchange', updateSize);
        // Listen for devicePixelRatio changes (zoom/magnify)
        const pixelRatioInterval = setInterval(() => {
            if (window.devicePixelRatio !== lastDevicePixelRatio) {
                lastDevicePixelRatio = window.devicePixelRatio;
                updateSize();
            }
        }, 250);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateSize);
            window.removeEventListener('orientationchange', updateSize);
            clearInterval(pixelRatioInterval);
        };
    }, [videoRef]);


    react.useEffect(() => {
        if (!env) return;
        const data = { record_id: recordId, divide_time: accuracy, version: detectionVersion };
        checkIfDetectionInProcess(data);
        checkIfDetectingExists(data);
    }, [env, recordId, accuracy, detectionVersion]);
    
    const checkIfDetectionInProcess = (data) => {
        if (!env || !data) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_IS_DETECTION_IN_PROCESS}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.running) {
                setDetectingStarted(true);
                setProgress(data.progress || 0);
                setDetectionInProcess(true);
            } else {
                setDetectingStarted(false);
                setProgress(0);
            }
        })
    }

    const checkIfDetectingExists = (data) => {
        if (!env || !data) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_DETECTION_EXISTS}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.exists) {
                setDetectionExists(true);
                setProgress(100); // Set progress to 100% if detecting exists
            } else {
                setDetectionExists(false);
                setProgress(0); // Reset progress if detecting does not exist
            }
        })
        .catch(error => {
            console.error('Error checking detecting existence:', error);
            setDetectionExists(false);
        });
    }

    const checkIfDetectingModifiedExists = (data) => {
        if (!env || !data) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_MODIFIED_DETECTION_EXISTS}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            
            if (data && data.exists) {
                setModifiedDetectingExists(true);
                setModifiedProgress(100); // Set progress to 100% if modified detecting exists
            } else {
                setModifiedDetectingExists(false);
                setModifiedProgress(0);
            }
        })
        .catch(error => {
            console.error('Error checking modified detecting existence:', error);
            setModifiedDetectingExists(false);
            setModifiedProgress(0);
        });
    }

    

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
                setCutZonesPoints(data.cut_zones);
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
                cut_zones: cutZonesPoints,
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
        if (!cutZonesEnabled && selectedPortal === '') {
            openNotification('error', 'Please select a portal first');
            return;
        }
        if(!cutZonesEnabled){
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
        }
        else {
            const pos = e.target.getStage().getPointerPosition();
            const stage = e.target.getStage();
            const canvasWidth = stage.width();
            const canvasHeight = stage.height();
            if(tool === 'eraser'){
                // Erase cut zones if near
                setCutZonesPoints(prevZones => {
                    const filteredZones = prevZones.filter(zone => !isPointNearLine(zone, pos.x/canvasWidth, pos.y/canvasHeight));
                    return filteredZones;
                });
                return;
            }

            isDrawing.current = true;
            // Cut zones would be a list of lists. Each list is for the current cut zone being drawn.
            setCutZonesPoints(prevLines => {
                const updatedPoints = [...prevLines];
                // Start a new cut zone with the first point
                updatedPoints.push([pos.x / canvasWidth, pos.y / canvasHeight]);
                return updatedPoints;
                
            });
        }
        
    };


    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        if(!cutZonesEnabled){
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
        } else {
            const stage = e.target.getStage();
            const point = stage.getPointerPosition();
            setCutZonesPoints(prevPoints => {
                const currentPoints = [...prevPoints];
                if (currentPoints.length === 0) return prevPoints; // nothing to update
                // Add the new point to the last cut zone
                const lastCutZone = [...currentPoints[currentPoints.length - 1]];
                lastCutZone.push(point.x / stage.width(), point.y / stage.height());
                currentPoints[currentPoints.length - 1] = lastCutZone;
                return currentPoints;
            });
        }
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
    
    const videoPointToScaledPoint = (points) => {
        if (!videoRef.current) {
            return [0, 0];
        }
        
        // Correctly destructure the points array
        let [x, y] = points;
        
        
        // x = x / videoRef.current.videoWidth;
        // y = y / videoRef.current.videoHeight;
        
        
        x = x * stageRef.current.width();
        y = y * stageRef.current.height();
        return [x, y];
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

    const stopDetectionProcess = () => {
        if (!detectingStarted){
            openNotification('error', 'No detection process to stop');
            return;
        }
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_TERMINATE_DETECTION_PROCESS}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ record_id: recordId, divide_time: accuracy, version: detectionVersion }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                setDetectingStarted(false);
                setDetectionInProcess(false);
                setProgress(0);
                openNotification('success', 'Detection process stopped successfully');
            }
        })
    }

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const removeDetections = () => {
        if (!detectionExists){
            openNotification('error', 'No detections to remove');
            return;
        }
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_DELETE_DETECTION}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ record_id: recordId, divide_time: accuracy, version: detectionVersion }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                setDetectionExists(false);
                setProgress(0);
                openNotification('success', 'Detections removed successfully');
            }
        })
        .catch(error => {
            openNotification('error', `Error removing detections: ${error.message}`);
        });
    }

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

    const startDetecting = () => {
        if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT) {
            openNotification('error', 'Environment variables not set');
            return;
        }
        if(progress !== 0) {
            openNotification('error', 'Detecting is already in progress');
            return;
        }
        const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_START_DETECTING}`;
        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                record_id: recordId,
                divide_time: accuracy,
                version: detectionVersion,
                lines: lines,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                setDetectingStarted(true);
                setDetectionInProcess(true);

                openNotification('success', 'Detecting started successfully');
            }
        })
        .catch(error => {
            openNotification('error', `Error starting detecting: ${error.message}`);
        });
    }

    react.useEffect(() => {
        if (!env || !recordId || !accuracy || !detectionVersion) return;
        const wsUrl = `ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/ws/detection_progress/${recordId}/${accuracy}/${detectionVersion}/`;
        const ws = new window.WebSocket(wsUrl);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.message){
                switch (data.message) {
                    case "DETECTION_STARTED":
                        
                        break;
                    case "DETECTION_AVAILABLE":
                        setDetectionExists(true);
                    default:
                        break;
                }
            }
            setDetectingStarted(true);
            if (Math.abs(data.progress - 100) < 1 ){
                setDetectionExists(true);
                setProgress(100); // Set progress to 100% if detecting exists
                setDetectingStarted(false);
            }
            if (data.progress !== undefined) setProgress(data.progress);
        };
        ws.onclose = () => { /* Optionally handle close */ };
        ws.onerror = (e) => { /* Optionally handle error */ };

        return () => ws.close();
    }, [env, recordId, accuracy, detectionVersion]);

    react.useEffect(() => {
        if (!recordId) {
            console.error('No record ID provided in the URL');
            return;
        }
    }, [recordId]);

    // Handler for video time update

    const getClosestTimeKey = (time, df) => {
        if (!df || !Array.isArray(df) || df.length === 0) return [];
        if (!videoRef.current) return [];

        // Group detections by time
        const detectionsByTime = df.reduce((acc, detection) => {
            const timeKey = detection.time;
            if (!acc[timeKey]) {
                acc[timeKey] = [];
            }
            acc[timeKey].push(detection);
            return acc;
        }, {});

        // Get array of times
        const times = Object.keys(detectionsByTime).map(t => parseFloat(t));
        if (times.length === 0) return [];
        
        // Find closest time
        const closestTime = times.reduce((prev, curr) => {
            return Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev;
        });
        if (Math.abs(closestTime - time) > accuracy) {
            return [];
        }

        // Return detections for closest time
        return detectionsByTime[closestTime] || [];
    }

    const handleTimeUpdate = () => {
        if (videoRef.current && !seeking) {
            setCurrentTime(videoRef.current.currentTime);
            setShowingDetectionDf(getClosestTimeKey(videoRef.current.currentTime, completeDf));
        }

        if (showDetections && videoRef.current && !showModifiedDetections) {
            if(maxTimeUpdated < videoRef.current.currentTime){
                const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_COUNTS_AT_TIME}`;
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ record_id: recordId, time: videoRef.current.currentTime, version: detectionVersion, divide_time: accuracy }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.detections) {
                        const detections = data.detections;
                        const maxTime = data.max_time;
                        setMaxTimeUpdated(maxTime);
                        setCompleteDf(detections);
                        const closestTimeData = getClosestTimeKey(videoRef.current?.currentTime || 0, detections);
                        setShowingDetectionDf(closestTimeData);
                    } else {
                        console.error('No detections found in the response');
                    }
                })
                .catch(error => {
                    console.error('Error checking detecting existence:', error);
                });
            }
        }
        
    };
    react.useEffect(() => {
        if (tool === 'cutzones') {
            setCutZonesEnabled(true);
        }
        else if (tool !== 'eraser'){
            setCutZonesEnabled(false);
        }
    }, [tool]);
    // Handler for video loadedmetadata
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const startCounting = () => {
        if (!detectionExists && !modifiedDetectingExists) {
            openNotification('error', 'No detections available. Please run detection first.');
            return;
        }

        if (lines && Object.keys(lines).length === 0) {
            openNotification('error', 'No lines defined. Please draw lines before starting the counter.');
            return;
        }

        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.AI_START_COUNTER}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ record_id: recordId, divide_time: accuracy, version: detectionVersion }),
        })
        .then(response => {
            try{
                return response.json()
            } catch(e){
                openNotification('error', 'Invalid response from server');
            }
            return null;
        })
        .then(data => {
            if (data.error) {
                openNotification('error', data.error);
            } else {
                setDetectingStarted(true);
                openNotification('success', 'Counter started successfully');
            }
        })
        .catch(error => {
            openNotification('error', `Error starting counter: ${error.message}`);
        });
    }

    
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
                <div className='flex items-center justify-between mb-5 gap-5'>
                    
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
                            {lines && !cutZonesEnabled &&lines[selectedPortal] && lines[selectedPortal].map((line, i) => (
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
                            {cutZonesEnabled && cutZonesPoints.length > 0 && cutZonesPoints.map((zone, i) => (
                                <Line
                                key={i}
                                points={pointsToScaledPoints(zone)}
                                stroke="#0000ff"
                                strokeWidth={3}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={zone.tool === 'eraser' ? 'destination-out' : 'source-over'}
                                />
                            ))

                            }
                            {showingDetectionDf.length > 0 && (showDetections || showModifiedDetections) && 
                                showingDetectionDf.map((obj, idx) => {
                                    
                                    let [x1, y1] = videoPointToScaledPoint([obj.x1, obj.y1]);
                                    let [x2, y2] = videoPointToScaledPoint([obj.x2, obj.y2]);
                                    return (
                                        <react.Fragment key={idx}>
                                            <Rect
                                                x={Math.ceil(x1)}
                                                y={Math.ceil(y1)}
                                                width={Math.ceil(x2 - x1)}
                                                height={Math.ceil(y2 - y1)}
                                                stroke="#00ff00"
                                                strokeWidth={3}
                                                fill={"rgba(0,255,0,0.1)"}
                                            />
                                            <Text
                                                x={Math.ceil(x1)}
                                                y={Math.ceil(y1) - 20}
                                                text={String(obj.track_id)}
                                                fontSize={18}
                                                fill="#00ff00"
                                                fontStyle="bold"
                                            />
                                        </react.Fragment>
                                    );
                                })
                            }
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
                    <div className='flex items-center gap-2.5'>
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
                <div className='flex flex-col items-center gap-2.5 mt-2.5'>
                    
                        {detectingStarted && (
                            <div className='w-full'>
                            <h1 className='text-white text-xl font-bold mb-2'>
                                Detection Progress
                            </h1>
                        
                            <LinearProgressWithLabel value={progress} variant="determinate" className='w-full' />
                             </div>

                        )}
                    {modifiedProgress !== 100 && modifyingDetectionStarted  && (
                        <div className='w-full'>
                            <h1 className='text-white text-xl font-bold mb-2'>
                                Modified Detection Progress
                            </h1>
                            <LinearProgressWithLabel value={modifiedProgress} variant="determinate" className='w-full' />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col h-full bg-main-300 justify-between">
                <div className="flex flex-col gap-2.5 p-2.5">
                    
                    <div>
                        <Divider
                            textAlign="left"
                            sx={{
                                '&::before, &::after': {
                                borderColor: 'secondary.light'
                                }
                            }}
                        >
                            <Chip label="Detection zone" className="!bg-main-400 !text-white !font-bold" />
                        </Divider>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        <FormControl className="w-full">
                            <InputLabel id="drawing-type-select-label" >
                                <Typography variant="body1" className='text-white'>
                                    Drawer
                                </Typography>
                            </InputLabel>
                            <Select
                                labelId="drawing-type-select-label"
                                id="demo-simple-select"
                                value={tool}
                                className='shadow-lg bg-main-400'
                                sx={{
                                    color: 'primary.white'
                                }}
                                label="Drawer"
                                onChange={(e) => setTool(e.target.value)}

                            >
                                <MenuItem value={'zone'}>
                                    <Typography variant="body1" color="textPrimary">
                                        Zone
                                        <FontAwesomeIcon icon={faClone} className="ml-2" />
                                    </Typography>
                                </MenuItem>
                                <MenuItem value={'cutzones'}>
                                    <Typography variant="body1" color="textPrimary">
                                        Cut Zones
                                        <FontAwesomeIcon icon={faVideoSlash} className="ml-2" />
                                    </Typography>
                                </MenuItem>

                                <MenuItem value={'direction'}>
                                    <Typography variant="body1" color="textPrimary">
                                        Direction
                                        <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
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
                                label={
                                    <Typography variant="body1" className='text-white'>
                                    Portal Name
                                    </Typography>
                                }
                                focused
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
                            <InputLabel id="demo-simple-select-label">
                            <Typography variant="body1" className='text-white'>
                                    Portal
                            </Typography>
                            </InputLabel>
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
                <div className='flex flex-col gap-5'>
                    <div>
                        <Divider
                            textAlign="left"
                            sx={{
                                '&::before, &::after': {
                                borderColor: 'secondary.light'
                                }
                            }}
                        >
                            <Chip label="Detection" className="!bg-main-400 !text-white !font-bold" />
                        </Divider>
                    </div>
                    <div className='flex flex-col items-center gap-2.5 p-2.5'>
                        <div className='w-full grid grid-cols-2 gap-2.5'>
                            <FormControl className="w-full">
                                <InputLabel id="counter-version-select-label">
                                    <Typography variant="body1" className='text-white'>
                                        Detection Version
                                    </Typography>
                                </InputLabel>
                                <Select
                                    labelId="counter-version-select-label"
                                    id="counter-version-select"
                                    value={detectionVersion}
                                    className='shadow-lg bg-main-400'
                                    sx={{
                                        color: 'primary.white'
                                    }}
                                    label="Detection Version"
                                    onChange={(e) =>{
                                        const data = { record_id: recordId, divide_time: accuracy, version: e.target.value }
                                        checkIfDetectingExists(data);
                                        checkIfDetectingModifiedExists(data);
                                        setDetectionVersion(e.target.value)
                                        }
                                    }
                                >
                                    <MenuItem value="v1">
                                        <Typography variant="body1" color="textPrimary">
                                            v1
                                        </Typography>
                                    </MenuItem>
                                    <MenuItem value="v2">
                                        <Typography variant="body1" color="textPrimary">
                                            v2
                                        </Typography>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                variant="outlined"
                                value={accuracy}
                                type="number"
                                onChange={(e) => {
                                    setAccuracy(e.target.value)
                                    const data = {record_id: recordId, divide_time: e.target.value, version: detectionVersion};
                                    checkIfDetectingExists(data);
                                    checkIfDetectingModifiedExists(data);
                                }}
                                className='shadow-lg bg-main-400'
                                focused
                                sx={{
                                    color: 'primary.white'
                                }}
                                label={<Typography className="text-white">Frame</Typography>}
                            />
                        </div>
                        
                        <div className='flex items-center justify-between w-full'>
                            <div className='flex justify-between gap-2.5 w-full'>
                                {!(detectionExists || detectingStarted) &&
                                    <Tooltip title="Run Detection" placement="right">
                                        <span className='h-full'>
                                            <Button
                                                className={`shadow-lg hover:!bg-main-400 !text-black h-full ${(detectionExists || detectingStarted) ? '!bg-gray-300' : '!bg-green-500 '}`}
                                                onClick={startDetecting}
                                                disabled={detectionExists || detectingStarted}
                                            >
                                                <FontAwesomeIcon icon={faMagnifyingGlass} className='text-center' />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                }
                                {(detectionExists) &&
                                    <Tooltip title="Open Counting Page" placement="right">
                                        <span className='h-full'>
                                            <Link to={`/counter-results?record-id=${recordId}&version=${detectionVersion}&divide-time=${accuracy}`} className='w-full h-full'>
                                                <Button
                                                    className={`shadow-lg hover:!bg-main-400 !text-black h-full !bg-yellow-500`}
                                                >
                                                    <FontAwesomeIcon icon={faChartBar} className='text-center' />
                                                </Button>
                                            </Link>

                                        </span>
                                    </Tooltip>
                                    
                                }

                                <Tooltip title="Show detections" placement="top">
                                    <span>
                                        <Button
                                            percentage={0}
                                            className={`shadow-lg hover:!bg-main-400 !text-black ${(!detectionExists && !detectionInProcess) ? '!bg-gray-300' : '!bg-green-500'} h-full`}
                                            disabled={!detectionExists && !detectionInProcess}
                                            onClick={() => {
                                                setShowModifiedDetections(false);
                                                setShowDetections(!showDetections);
                                                if (showDetections) {
                                                    openNotification('info', 'Counts are now hidden');
                                                } else {   
                                                    openNotification('info', 'Counts now are visible');
                                                }                                                
                                            }}
                                        >
                                            <FontAwesomeIcon icon={!showDetections ? faEye : faEyeSlash} className='text-center'  />
                                        </Button>
                                    </span>
                                </Tooltip>
                                {!detectionInProcess &&
                                    <Tooltip title="Remove detections" placement="left">
                                        <span className='h-full'>
                                            <Button
                                                className={`shadow-lg hover:!bg-main-400 !text-black h-full ${!detectionExists ? '!bg-gray-300' : '!bg-red-500'}`}
                                                disabled={!detectionExists}
                                                onClick={removeDetections}
                                            >
                                                <FontAwesomeIcon icon={faTrash} className='text-center' />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                }
                                {detectionInProcess &&
                                    <Tooltip title="Stop detections" placement="left">
                                        <span className='h-full'>
                                            <Button
                                                className={`shadow-lg hover:!bg-main-400 !text-black h-full ${!detectionInProcess ? '!bg-gray-300' : '!bg-red-500'}`}
                                                onClick={stopDetectionProcess}
                                            >
                                                <FontAwesomeIcon icon={faStop} className='text-center' />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                }
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
            <Notification open={open} severity={severity} message={message} onClose={closeNotification} autoHideDuration={autoHideDuration} />
        </div>
        
    );
};

export default AutoDetection;