import React from 'react';
import './assets/main.css';
import Vision from './components/Vision';
import VisionContainer from './components/VisionContainer';
import {
    Button,
    Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import { useLocation } from 'react-router-dom';
import Notification from './components/Notification';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Recording() {
    const query = useQuery();
    const [env, setEnv] = React.useState({});
    const [visions, setVisions] = React.useState([]);

    const [severity, setSeverity] = React.useState("info");
    const [message, setMessage] = React.useState("Note archived");
    const [open, setOpen] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const navigate = useNavigate();
    const token = query.get('token');

    
    if(!token) {
        return (
            <div className='w-screen h-screen flex items-center justify-center'>
                <div className='text-white text-xl'>No token provided. Please go back to the previous page</div>
            </div>
        );
    }
    React.useEffect(() => {
        window.env.get().then(setEnv);
      }, []);

    React.useEffect(() => {
        // Set the token in localStorage for use in Vision components
        if (env.BACKEND_SERVER_DOMAIN && env.BACKEND_SERVER_PORT && env.GET_RECORDS_URL){
            console.log(`Backend URL: ${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}`);
            const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}`;
            const streamUrl = `${backendUrl}/${env.GET_RECORDS_URL}/${token}`;
            console.log("token", token);
            fetch(streamUrl)
            .then(response => response.json())
            .then(data => {
                if (data.urls && data.urls.length > 0) {
                    console.log(`Fetched ${data.urls} visions from backend.`);
                    const visionsData = data.urls.map((item) => ({
                        id: item.id,
                        src: `${item.url}`,
                        finished_detecting: item.finished_detecting,
                        cameraUrl: item.url,
                        onRemove: (id) => {
                            // Handle remove action
                            console.log(`Remove vision with ID: ${id}`);
                        },
                        onInfo: () => {
                            alert(`ID: ${item.id}\nSource: ${item.url}`);
                        }
                    }));
                    console.log(visionsData);
                    setVisions(visionsData);
                } else {
                    setVisions([]);
                    console.log("No visions found.");
                }
            })
        }
    }, [env, token]);

    const downloadAllmanualCountExcels = () => {
        if (!env) return;
        const backendUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_DOWNLOAD_ALL_SAME_TOKEN_RECORDS_MANUAL_COUNT_EXCELS}`;
        setIsDownloading(true);
        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            setIsDownloading(false);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `all_info.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            openNotification('success', 'Download started successfully.');
        })
        .catch(error => {
            setIsDownloading(false);
            console.error('There was a problem with the fetch operation:', error);
            openNotification('error', 'Failed to start download.');
        });
    }

    const openNotification = (severity, message) => {
        setSeverity(severity);
        setMessage(message);
        setOpen(true);
    };

    const closeNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    
    return (
        <>
        <div className='relative w-full h-full flex flex-col items-center'>
            <div className="absolute flex justify-center items-center gap-5 top-5 left-5 z-10">
                <Button onClick={() =>{
                    navigate(-1);
                }}>
                    Back
                </Button>
                <Tooltip title="Download All Results" placement="top">
                    <Button
                        className={`shadow-lg hover:!bg-main-400 !text-black h-full !bg-main-100`}
                        onClick={downloadAllmanualCountExcels}
                        >
                            {isDownloading ? (
                                <CircularProgress size={24} className="text-center color-main-500" />
                            ) : (
                                <DownloadIcon className='text-center' />
                            )}
                    </Button>
                </Tooltip>
            </div>
            <div className='flex items-center p-2.5 gap-2.5'>
                
                <h1 className='text-white text-2xl font-bold'>
                    {visions.map(vision => vision.id).join(', ')}

                </h1>
            </div>
            <VisionContainer>                {visions && visions.length > 0 ? (
                    visions.map((visionProps, idx) => (
                        <Vision finished_detecting={visionProps.finished_detecting} video key={visionProps.id} token={token} {...visionProps} />
                ))
                ) : (
                    <div className="text-white text-center w-full py-10">No visions available.</div>
                )}
            </VisionContainer>
            <div className='flex justify-center items-center'>
                

            </div>
        </div>
        <Notification
            open={open}
            severity={severity}
            message={message}
            onClose={closeNotification}
        />
        </>
    );
}

export default Recording;