import React from 'react';
import './assets/main.css';
import Vision from './components/Vision';
import VisionContainer from './components/VisionContainer';
import {
    Button,
    Link
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import Notification from './components/Notification';
import RecordVision from './components/RecordVision';

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
            fetch(streamUrl)
            .then(response => response.json())
            .then(data => {
                if (data.urls && data.urls.length > 0) {
                    console.log(`Fetched visions:`, data.urls);
                    const visionsData = data.urls.map((item) => ({
                        id: item.id,
                        src: `${item.url}`,
                        cameraUrl: item.url,
                        onRemove: (id) => {
                            // Handle remove action
                            console.log(`Remove vision with ID: ${id}`);
                        },
                        onInfo: () => {
                            alert(`ID: ${item.id}\nSource: ${item.url}`);
                        }
                    }));
                    setVisions(visionsData);
                } else {
                    setVisions([]);
                    open
                }
            })
        }
    }, [env, token]);

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
        <div className='w-screen h-screen flex flex-col'>
            <div className='flex items-center p-2.5 gap-2.5'>
                <Link href="/">
                    <Button className="!bg-main-500 !p-2.5 !w-10">
                        <FontAwesomeIcon icon={faChevronLeft} className='text-white' />
                    </Button>
                </Link>
                <h1 className='text-white text-2xl font-bold'>Camera Vision Recording</h1>
            </div>
            <VisionContainer>
                {visions && visions.length > 0 ? (
                    visions.map((visionProps, idx) => (
                        <Vision video key={idx} {...visionProps} />
                ))
                ) : (
                    <div className="text-white text-center w-full py-10">No visions available.</div>
                )}
            </VisionContainer>
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