import "../assets/main.css";
import React from 'react';


import {
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

    return (
        <ListItem className={`!bg-main-500 hover:!bg-main-700 shadow-xl overflow-hidden${props.roundedClass}`} key={props.id} disablePadding secondaryAction={
            <Tooltip title="Delete Camera Stream" placement="top">
                <IconButton edge="end" aria-label="delete" onClick={onRemove}>
                    <DeleteIcon color="secondary" />
                </IconButton>
            </Tooltip>
            }>
            <Link className="w-full h-full" href="/editor">
                <ListItemButton className="flex flex-row gap-2.5" >
                    <div className="flex flex-col">
                        <Typography className="text-white">{props.ip}</Typography>
                        <Typography className="text-gray-400">At {props.startTime}</Typography>
                    </div>
                    <div className="flex">
                        {props.duration}
                    </div>
                </ListItemButton>
            </Link>
        </ListItem>
    );
};

export default RecordLink;
