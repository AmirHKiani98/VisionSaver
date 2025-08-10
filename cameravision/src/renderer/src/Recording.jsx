import React from 'react';
import './assets/main.css';
import Vision from './components/Vision';
import VisionContainer from './components/VisionContainer';
import {
    Button,
    Link
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import Notification from './components/Notification';
import { useNavigate } from 'react-router-dom';
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
                        finished_counting: item.finished_counting,
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
            <div className="absolute top-5 left-5 z-10">
                <Button onClick={() =>{
                    navigate(-1);
                }}>
                    Back
                </Button>
            </div>
            <div className='flex items-center p-2.5 gap-2.5'>
                
                <h1 className='text-white text-2xl font-bold'>
                    {visions.map(vision => vision.id).join(', ')}

                </h1>
            </div>
            <VisionContainer>                {visions && visions.length > 0 ? (
                    visions.map((visionProps, idx) => (
                        <Vision finished_counting={visionProps.finished_counting} video key={visionProps.id} token={token} {...visionProps} />
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