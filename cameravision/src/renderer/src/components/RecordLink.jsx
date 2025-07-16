import '../assets/main.css'
import React from 'react'

import { Link } from 'react-router-dom'
import { ListItem, Tooltip, IconButton, ListItemButton, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'

const RecordLink = (props) => {
  // Define the onRemove handler, either from props or as a placeholder
  const onRemove = props.onRemove || (() => { })
  const [recordingClass, setRecordingClass] = React.useState('text-white')
  const [recordsId, setRecordsId] = React.useState(props.recordsId || [])
  const [progresses, setProgresses] = React.useState({})
  const [env, setEnv] = React.useState(null)
  React.useEffect(() => {
    if (!props.recordsId) return
    const progressDict = {}
    props.recordsId.forEach((recordId) => {
      progressDict[recordId] = 0 // Initialize progress for each record ID
    })
    setRecordsId(props.recordsId)

  }, [props.recordsId])
  React.useEffect(() => {
    window.env.get().then(setEnv)
  }, [])

  React.useEffect(() => {
    if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT || !env.WEBSOCKET_RECORD_PROGRESS) return;

    const sockets = {};

    recordsId.forEach((recordId) => {
      const ws = new WebSocket(
        `ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.WEBSOCKET_RECORD_PROGRESS}/${recordId}/`
      );

      sockets[recordId] = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(recordId, 'Received progress data:', data);
        if (data.progress !== undefined) {
          setProgresses((prev) => ({ ...prev, [recordId]: data.progress }));
        }
      };

      ws.onerror = (err) => {
        console.error(`WebSocket error on recordId ${recordId}`, err);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for recordId ${recordId}`);
      };
    });

    return () => {
      // Cleanup
      Object.values(sockets).forEach((ws) => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      });
    };
  }, [env, recordsId]);
  // TODO: This is too much. It might cause performance issues if there are many records.
  // React.useEffect(() => {
  //     const intervalId = setInterval(() => {
  //         setRecordingClass(prev =>
  //             prev === "text-white" ? "text-red-500" : "text-white"
  //         );
  //     }, 500);
  //     return () => clearInterval(intervalId); // Cleanup on unmount
  // }, []);
  // Helper function to format date as mm-dd-yyyy hh:mm:ss

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    if (isNaN(date)) return ''
    const pad = (n) => n.toString().padStart(2, '0')
    const mm = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const yyyy = date.getFullYear()
    const hh = pad(date.getHours())
    const min = pad(date.getMinutes())
    const ss = pad(date.getSeconds())
    return `${mm}-${dd}-${yyyy} ${hh}:${min}:${ss}`
  }

  return (
    <Tooltip
      title={props.done ? 'Review' : props.inProcess ? 'Recording...' : 'Wait for start'}
      placement="top"
    >
      <ListItem
        className={`!bg-main-500 hover:!bg-main-700 shadow-xl overflow-hidden ${props.roundedClass || ''}`}
        key={props.id}
        disablePadding
        secondaryAction={
          <div>
            {props.inProcess ? (
              <Tooltip title="Rec" placement="top">
                <IconButton disabled edge="end" aria-label="rec">
                  <RadioButtonCheckedIcon className="text-red-300" />
                </IconButton>
              </Tooltip>
            ) : props.done ? (
              <Tooltip title="Done" placement="top">
                <IconButton edge="end" aria-label="done">
                  <CheckBoxIcon className="text-green-300" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Scheduled" placement="top">
                <IconButton edge="end" aria-label="set">
                  <AccessAlarmIcon className="text-yellow-300" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Delete" placement="top">
              <IconButton edge="end" aria-label="delete" onClick={props.onRemove}>
                <DeleteIcon color="secondary" />
              </IconButton>
            </Tooltip>
          </div>
        }
      >
        <Link
          to={`/editor?token=${props.token}`}
          className={`w-full h-full ${props.done ? 'cursor-pointer' : 'cursor-default'}`}
          tabIndex={props.done ? 0 : -1}
          aria-disabled={!props.done}
          style={{ textDecoration: 'none' }} // optional if you want no underline
        >
          <ListItemButton className="flex flex-row gap-10" disabled={!props.done}>
            <div className="flex flex-col">
              <Typography className="text-white">Start at:</Typography>
              <Typography className="text-gray-400">{formatDateTime(props.startTime)}</Typography>
            </div>
            <div className="flex flex-col">
              <Typography className="text-white">Duration</Typography>
              <Typography className="text-gray-400">{props.duration}</Typography>
            </div>
          </ListItemButton>
        </Link>
      </ListItem>
    </Tooltip>
  )
}

export default RecordLink
