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
    const [lines, setLines] = react.useState([]);
    const isDrawing = react.useRef(false);
    const [tool, setTool] = react.useState('pen'); // 'pen'
    const drawing = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { tool, points: [pos.x, pos.y] }]);
    };
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { tool, points: [pos.x, pos.y] }]);
    };
    const handleMouseMove = (e) => {
        // no drawing - skipping
        if (!isDrawing.current) {
        return;
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastLine = lines[lines.length - 1];
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // replace last
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    };

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
                        <video src={videoSrc} className='w-full h-full'></video>
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
                                {lines.map((line, i) => (
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
                </div>
            </div>
        </div>
    );
};

export default AutoCounter;