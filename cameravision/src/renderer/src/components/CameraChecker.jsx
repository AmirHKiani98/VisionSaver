import React from 'react'
import {LinearProgress, Box, Typography, Button} from '@mui/material';
export default function CameraChecker() {
    const [env, setEnv] = React.useState({});
    const [progress, setProgress] = React.useState(0);
    const [checkingStarted, setCheckingStarted] = React.useState(false);
    const [version, setVersion] = React.useState('v1');
    const [badSignals, setBadSignals] = React.useState([]);
    React.useEffect(() => {
        // Get the env
        window.env.get().then(setEnv)
    }, []);
    
    const startCameraCheck = () => {
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_START_CHECKING_CAMERA}`;
        console.log("Starting camera check via:", url);
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({version: version})
        }).then(response => response.json())
          .then(data => {
            if (data.status == 200) {
                console.log("Camera check started successfully:", data);
                setCheckingStarted(true);
                // Start listening to WebSocket for progress updates
                const wsUrl = `ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/ws/checking_camera/${version}/`;
                const socket = new WebSocket(wsUrl);
                socket.onmessage = function(event) {
                    const messageData = JSON.parse(event.data);
                    if (messageData.progress !== undefined) {
                        setProgress(messageData.progress);
                    }
                    if (messageData.potential_camera !== undefined) {
                        // If potential_camera doesn't exist in badSignals, add it
                        setBadSignals(prevBadSignals => {
                            if (!prevBadSignals.includes(messageData.potential_camera)) {
                                return [...prevBadSignals, messageData.potential_camera];
                            }
                            return prevBadSignals;
                        });
                    }
                    if (messageData.remove_potential_camera !== undefined) {
                        setBadSignals(prevBadSignals => prevBadSignals.filter(cam => cam !== messageData.remove_potential_camera));
                    }
                };
                socket.onclose = function(event) {
                    console.log("WebSocket closed:", event);
                };
            } else {
                console.error('Error starting camera check:', data);
            }
            }).catch(error => {
                console.error('Error starting camera check:', error);
            }
        );
    }

    const cancelChecking = () => {
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_CANCEL_CHECKING_CAMERA}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({version: version})
        }).then(response => response.json())
          .then(data => {
            if (data.status == 200) {
                console.log("Camera check cancelled successfully:", data);
            }
            }).catch(error => {
                console.error('Error cancelling camera check:', error);
            }
        );
        setCheckingStarted(false);
        setProgress(0);
    }


    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[800px] bg-main-500 shadow-2xl p-10 rounded-lg flex flex-col gap-5 max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Camera Checker</h2>
            {!checkingStarted ? (
                <div className="flex flex-col gap-4">
                    <button
                        onClick={startCameraCheck}
                        className="bg-main-200 text-black font-bold shadow-lg px-4 py-2 rounded hover:bg-main-600 hover:text-white"
                    >
                        Start Camera Check
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" color="white" gutterBottom>
                        Checking Camera Progress
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" color="white" align="center">
                        {`${Math.round(progress)}%`}
                    </Typography>
                </Box>
                <div>
                    <Button
                        variant="contained"
                        onClick={() => cancelChecking()}
                        className="bg-main-200 text-black font-bold shadow-lg px-4 py-2 rounded hover:bg-main-600 hover:text-white mt-4"
                    >
                        Cancel
                    </Button>
                </div>
                <div className='flex flex-col'>
                    <h3 className="text-xl font-bold text-white mt-4">Potential Bad Camera Signals:</h3>
                    {badSignals.length === 0 ? (
                        <p className="text-white">No bad camera signals detected.</p>
                    ) : (
                        <ul className="list-disc list-inside text-white">
                            {badSignals.map((signal, index) => (
                                <li key={index}>{signal}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}