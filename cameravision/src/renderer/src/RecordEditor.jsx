import "./assets/main.css";
import react from 'react';
import {
    CircularProgress,
    Button,
    Link
} from '@mui/material';
import { useLocation } from 'react-router-dom';
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
    const [open, setOpen] = react.useState(false);
    const [severity, setSeverity] = react.useState('info');
    const [message, setMessage] = react.useState('');

    const closeNotification = () => {
        setOpen(false);
        setSeverity('info');
        setMessage('');
    }


    

    return (
        <>
            <div className="relative w-screen h-screen flex overflow-hidden">
                <div className="flex w-3/4 flex-col justify-between bg-blue-600">
                    <Record id={recordId} recordId={recordId} />
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-100">

                </div>
            </div>
            <Notification
                open={open}
                severity={severity}
                message={message}
                onClose={closeNotification}
            />
        </>

    )

}

export default RecordEditor;