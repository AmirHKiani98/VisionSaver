import "../assets/main.css";
import React from 'react';


import {
    Link,
    ListItem,
    Tooltip,
    IconButton,
    ListItemButton,
    Typography

} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const RecordLink = (props) => {
    // Define the onRemove handler, either from props or as a placeholder
    const onRemove = props.onRemove || (() => {});

    // Helper function to format date as mm-dd-yyyy hh:mm:ss
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) return "";
        const pad = (n) => n.toString().padStart(2, '0');
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const yyyy = date.getFullYear();
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        const ss = pad(date.getSeconds());
        return `${mm}-${dd}-${yyyy} ${hh}:${min}:${ss}`;
    };

    return (
        <ListItem className={`!bg-main-500 hover:!bg-main-700 shadow-xl overflow-hidden${props.roundedClass}`} key={props.id} disablePadding secondaryAction={
            <Tooltip title="Delete Camera Stream" placement="top">
                <IconButton edge="end" aria-label="delete" onClick={onRemove}>
                    <DeleteIcon color="secondary" />
                </IconButton>
            </Tooltip>
            }>
            <Link className="w-full h-full" href="/editor">
                <ListItemButton className="flex flex-row gap-10" >
                    <div className="flex flex-col">
                        <Typography className="text-white">IP: {props.ip}</Typography>
                        <Typography className="text-gray-400">At {formatDateTime(props.startTime)}</Typography>
                    </div>
                    <div className="flex flex-col">
                        <Typography className="text-white">Duration</Typography>
                        <Typography className="text-gray-400">{props.duration}</Typography>
                    </div>
                </ListItemButton>
            </Link>
        </ListItem>
    );
};

export default RecordLink;
