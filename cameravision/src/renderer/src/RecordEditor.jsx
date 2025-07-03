import "./assets/main.css";
import react from 'react';
import {
    CircularProgress,
    Button,
    Link,
    Divider,
    Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ContextMenu from './components/ContextMenu';
import Notification from './components/Notification';
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
import Record from './components/Record';
const RecordEditor = (props) => {
    
    const [env, setEnv] = react.useState(props.env || null);
    const query = useQuery();
    const recordId = query.get('record_id');
    const token = query.get('token');
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');
    const navigate = useNavigate();
    const closeNotification = () => {
        setOpen(false);
        setSeverity('info');
        setMessage('');
    }


    

    return (
        <div className="relative w-screen h-screen flex overflow-hidden">
            <div className="absolute top-10 left-10 z-10">
                <Button onClick={() =>{
                    navigate(-1);
                }}>
                    Back
                </Button>
            </div>
            <div className="absolute w-screen h-screen flex overflow-hidden">
                
                <div className="flex w-3/4 flex-col justify-between bg-main-600 p-20">
                <Button></Button>
                    <Record id={recordId} recordId={recordId} />
                </div>
                <div className="flex-1 justify-center bg-main-300 py-2">
                    <Divider textAlign="right"  sx={{
                      "&::before, &::after": {
                        borderColor: "secondary.light",
                      },
                      }}>
                      <Chip label="History" className="!bg-main-400 !text-white !font-bold" />
                    </Divider>
                </div>
            </div>
            <Notification
                open={open}
                severity={severity}
                message={message}
                onClose={closeNotification}
            />
        </div>

    )

}

export default RecordEditor;