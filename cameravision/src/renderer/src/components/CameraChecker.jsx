import React from 'react'
import {LinearProgress, Box, Typography, Button} from '@mui/material';
export default function CameraChecker({checkingStarted, setCheckingStarted, checkCameraProgress, setCheckCameraProgress, checkCameraVersion, setCheckCameraVersion, badSignals, setBadSignals}) {
    const [env, setEnv] = React.useState({});
    
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
            body: JSON.stringify({version: checkCameraVersion})
        }).then(response => response.json())
          .then(data => {
            if (data.status == 200) {
                console.log("Camera check started successfully:", data);
                setCheckingStarted(true);
                // Start listening to WebSocket for progress updates
                
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
            body: JSON.stringify({version: checkCameraVersion})
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
        setCheckCameraProgress(0);
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
                    <LinearProgress variant="determinate" value={checkCameraProgress} />
                    <Typography variant="body2" color="white" align="center">
                        {`${Math.round(checkCameraProgress)}%`}
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