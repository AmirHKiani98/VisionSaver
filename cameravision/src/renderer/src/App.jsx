import './assets/main.css'
import { useState, useEffect } from 'react'

// Material Tailwind
import { Button } from '@material-tailwind/react'

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo,
  faClockRotateLeft,
  faRecordVinyl
} from '@fortawesome/free-solid-svg-icons'

// MUI - Pickers
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'

// MUI - Core
import {
  TextField,
  Select,
  MenuItem,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  InputLabel,
  FormControl,
  Pagination,
  Tooltip
} from '@mui/material'

import dayjs from 'dayjs'
import Vision from './components/Vision' // Assuming Vision is a component that displays video streams
import VisionContainer from './components/VisionContainer'

import Notification from './components/Notification'
import RecordLink from './components/RecordLink'
const today = dayjs()
const oneHourFromNow = today.add(1, 'hour')

function App() {
  const recordLinksPerPage = 4
  const [startRecordLinkIndex, setStartRecordLinkIndex] = useState(0)
  const [time, setTime] = useState(oneHourFromNow)
  const [protocol, setProtocol] = useState('RTSP')
  const [ip, setIp] = useState('192.168.')
  const [channel, setChannel] = useState('quad')
  const [duration, setDuration] = useState(30) // Duration in minutes
  const [cleared, setCleared] = useState(false)
  const [visions, setVisions] = useState([])
  const [severity, setSeverity] = useState('info')
  const [message, setMessage] = useState('Note archived')
  const [open, setOpen] = useState(false)
  const [env, setEnv] = useState({})
  const [recordLinks, setRecordLinks] = useState([])
  useEffect(() => {
    window.env.get().then(setEnv)
  }, [])

  const closeNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  useEffect(() => {
    if (env.BACKEND_SERVER_DOMAIN && env.BACKEND_SERVER_PORT && env.API_GET_RECORD_SCHEDULE) {
      const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_RECORD_SCHEDULE}`
      fetch(apiLink)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // camera_url should be changed to cameraUrl
            data = data.map((record) => ({
              ...record,
              cameraUrl: record.camera_url || record.cameraUrl // Ensure cameraUrl is set correctly
            }))
            setRecordLinks(data)
          } else if (data.records) {
            const records = data.records.map((record) => ({
              ...record,
              cameraUrl: record.camera_url || record.cameraUrl, // Ensure cameraUrl is set correctly
              startTime: record.start_time || record.startTime,
              inProcess: record.in_process || record.inProcess
            }))

            setRecordLinks(records)
          } else {
            setRecordLinks([])
          }
        })
        .catch((e) => {
          setRecordLinks([])
        })
    }
  }, [env])
  const openNotification = (severity, message) => {
    setSeverity(severity)
    setMessage(message)
    setOpen(true)
  }
  const addStream = (cameraUrl, id) => {
    const streamUrl = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.STREAM_FUNCTION_NAME}/?url=${cameraUrl}`

    const newVisionInfo = {
      src: streamUrl,
      ip: ip,
      cameraUrl: cameraUrl,
      id: `camera-${id}`,
      onRemove: onRemoveStream
    }
    setVisions((prev) => [...prev, newVisionInfo])
  }

  const getResolvedUrl = (cameraUrl) => {
    const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_RESOLVED_URL}?url=${cameraUrl}`
    return fetch(apiLink)
      .then((response) => response.json())
      .then((data) => {
        if (data.status && data.status !== 200) {
          openNotification('error', data.message || 'Failed to resolve camera URL.')
          return null
        }
        return data.resolved_url || data.cameraUrl || cameraUrl
      })
      .catch((error) => {
        openNotification('error', 'Failed to resolve camera URL.')
        return null
      })
  }

  const addStreamHandler = (e) => {
    e.preventDefault()
    if (!protocol) {
      openNotification('error', 'Please select a protocol (RTSP, HTTP, or HTTPS).')
      return
    }
    if (!ip) {
      openNotification('error', 'Please enter a valid IP address.')
      return
    }
    if (!channel) {
      openNotification('error', 'Please enter a valid channel.')
      return
    }
    const protocolLower = protocol.toLowerCase()
    if (!ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      openNotification('error', 'Invalid IP address format. Please use xxx.xxx.xxx.xxx format')
      return
    }
    if (channel === 'quad') {
      // Assuming "quad" means the intersection has four cameras: cam1, cam2, cam3 and cam4
      
      for (let i = 1; i <= 4; i++) {
        const cameraUrl = `${protocolLower}://${ip}/cam${i}`
        getResolvedUrl(cameraUrl).then((resolvedUrl) => {
          if (resolvedUrl) {
            addStream(resolvedUrl, `${ip}-${i}`)
          }
        })
        addStream(resolvedUrl, `${ip}-${i}`)
      }
    } else {
      const cameraUrl = `${protocolLower}://${ip}/${channel}`
      getResolvedUrl(cameraUrl).then((resolvedUrl) => {
        if (resolvedUrl) {
          addStream(resolvedUrl, `${ip}-${channel}`)
        }
      })
    }

    setProtocol('RTSP')
    setIp('192.168.')
    setChannel('quad')
    openNotification('success', 'Camera stream added.')
  }

  const addCronJob = () => {
    if (!time || !duration) {
      openNotification('error', 'Please select a start time and duration.')
      return
    }
    // Check if the time is in the past
    if (time.isBefore(dayjs())) {
      openNotification('error', 'Start time cannot be in the past.')
      return
    }
    // Check if the duration is a positive number
    if (duration <= 0) {
      openNotification('error', 'Duration must be a positive number.')
      return
    }
    // Check vision length
    if (visions.length === 0) {
      openNotification('error', 'No camera streams available to set cron job.')
      return
    }

    // Format startTime in ISO 8601 with full timezone info for Django backend
    const startTime = time.toISOString()
    const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_STORE_RECORD_SCHEDULE}`
    const randomString = Array.from({ length: 100 }, () => Math.random().toString(36)[2]).join('')
    for (const vision of visions) {
      const cameraUrl = vision.cameraUrl

      const data = {
        start_time: startTime,
        duration: duration,
        camera_url: cameraUrl,
        token: randomString // Unique token for the cron job
      }

      fetch(apiLink, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status && data.status !== 200) {
            openNotification('error', data.message || 'Failed to create cron job.')
            return
          }
          setVisions([]) // Clear visions after setting cron job

          openNotification('success', 'Cron job created successfully.')
        })
        .catch((error) => {
          openNotification('error', 'Failed to create cron job.')
          return
        })
    }
    setRecordLinks((prev) => [
      ...prev,
      {
        startTime: startTime,
        duration: duration,
        token: randomString
      }
    ])
  }
  const removeStreamHandler = (id) => {
    setVisions((prev) => prev.filter((vision) => vision.id !== id))
    openNotification('success', 'Camera stream deleted.')
  }

  const onRemoveStream = (id) => {
    if (id) {
      removeStreamHandler(id)
    } else {
      openNotification('error', 'No camera stream ID found.')
    }
  }

  const onRemoveRecord = (token) => {
    if (!token) {
      openNotification('error', 'No record token found.')
      return
    }

    const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_DELETE_RECORD_SCHEDULE}`
    fetch(apiLink, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status && data.status !== 200) {
          openNotification('error', data.message || 'Failed to delete record.')
          return
        }
        setRecordLinks((prev) => prev.filter((record) => record.token !== token))
        openNotification('success', 'Record deleted successfully.')
      })
      .catch((error) => {
        openNotification('error', 'Failed to delete record.')
      })
  }

  return (
    <>
      <div className="min-h-full min-w-full flex p-5">
        <div className="text-white flex flex-col w-full items-center gap-7">
          <h1 className="text-2xl font-bold">Vision Camera Saver</h1>
          <div className="flex w-full gap-10">
            <div className="flex flex-col w-1/2 gap-5">
              <form
                id="camera-stream-form"
                className="flex flex-col justify-between w-full"
                action="#"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FormControl>
                      <InputLabel id="protocol-select-label">
                        <Typography className="text-white">Protocol</Typography>
                      </InputLabel>
                      <Select
                        labelId="protocol-select-label"
                        id="select-protocol"
                        color="primary.white"
                        className="shadow-lg !py-0 w-32 bg-main-400"
                        value={protocol}
                        sx={{
                          color: 'primary.white'
                        }}
                        onChange={(e) => setProtocol(e.target.value)}
                      >
                        <MenuItem value="RTSP">RTSP</MenuItem>
                        <MenuItem value="HTTP">HTTP</MenuItem>
                        <MenuItem value="HTTPS">HTTPS</MenuItem>
                      </Select>
                    </FormControl>
                    <p className="text-xl">://</p>
                    <TextField
                      value={ip}
                      variant="outlined"
                      className="bg-main-400 rounded-md w-40"
                      label={<Typography className="text-white">IP</Typography>}
                      onChange={(e) => setIp(e.target.value)}
                    />
                    <p className="text-xl">/</p>
                    <TextField
                      value={channel}
                      className="bg-main-400 rounded-md w-24"
                      label={<Typography className="text-white">Channel</Typography>}
                      variant="outlined"
                      onChange={(e) => setChannel(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-5">
                    <Tooltip title="Add Camera Stream" placement="top">
                      <Button
                        id="submit-camera"
                        onClick={addStreamHandler}
                        className="bg-main-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700"
                      >
                        <FontAwesomeIcon icon={faVideo} className="text-white" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </form>
              <div className="flex flex-col justify-between col-span-2 w-full gap-2.5">
                <div className="flex gap-2.5">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      className="bg-main-400 rounded-md w-1/3"
                      color="primary.white"
                      label={<Typography className="text-white">Start Date</Typography>}
                      slotProps={{
                        field: { clearable: false, onClear: () => setCleared(true) }
                      }}
                      minDate={today}
                      value={time}
                      onChange={(newValue) => {
                        if (newValue) {
                          setTime(newValue.hour(time.hour()).minute(time.minute()))
                        }
                      }}
                    />
                    <TimePicker
                      className="bg-main-400 w-1/3 rounded-md"
                      label={<Typography className="text-white">Start Time</Typography>}
                      value={time}
                      onChange={setTime}
                      disablePast
                    />
                    <TextField
                      id="outlined-number"
                      type="number"
                      className="bg-main-400 w-1/3 rounded-md"
                      slotProps={{
                        inputLabel: {
                          shrink: true
                        }
                      }}
                      value={duration}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value >= 0) {
                          setDuration(value)
                        } else {
                          openNotification('error', 'Duration must be a positive number.')
                        }
                      }}
                      label={<Typography className="text-white">Duration (minutes)</Typography>}
                    />
                  </LocalizationProvider>
                </div>
                <div className="flex justify-between items-center gap-2.5">
                  <Tooltip title="Start Recording Right Away" placement="right">
                    <Button
                      id="submit-start-recording"
                      className="bg-red-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-red-700"
                    >
                      <FontAwesomeIcon icon={faRecordVinyl} />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Add Cron Job for Recording" placement="top">
                    <Button
                      id="submit-add-cronjob"
                      className="bg-yellow-600 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-yellow-700"
                      onClick={addCronJob}
                    >
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <Divider
                textAlign="left"
                sx={{
                  '&::before, &::after': {
                    borderColor: 'secondary.light'
                  }
                }}
              >
                <Chip label="Record Links" className="!bg-main-400 !text-white !font-bold" />
              </Divider>
              <List>
                {recordLinks.length === 0 ? (
                  <ListItem className="!bg-main-700 text-white rounded-lg shadow-lg">
                    No records found
                  </ListItem>
                ) : (
                  recordLinks
                    .slice(startRecordLinkIndex, startRecordLinkIndex + recordLinksPerPage)
                    .map((record, idx) => {
                      const isFirst = idx === 0
                      const isLast =
                        idx ===
                        Math.min(recordLinksPerPage, recordLinks.length - startRecordLinkIndex) - 1
                      let roundedClass = ''
                      if (isFirst) roundedClass += ' rounded-t-md'
                      if (isLast) roundedClass += ' rounded-b-md'
                      return (
                        <RecordLink
                          token={record.token}
                          startTime={record.startTime}
                          duration={record.duration}
                          key={startRecordLinkIndex + idx}
                          roundedClass={roundedClass}
                          onRemove={() => onRemoveRecord(record.token)}
                          inProcess={record.inProcess}
                          done={record.done}
                        />
                      )
                    })
                )}
              </List>
              <div className="flex justify-center p-2.5">
                <Pagination
                  count={Math.ceil(recordLinks.length / recordLinksPerPage)}
                  onChange={(event, value) => {
                    const newIndex = (value - 1) * recordLinksPerPage
                    setStartRecordLinkIndex(newIndex)
                  }}
                  shape="rounded"
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#fff' // Set text color to white
                    },
                    '& .Mui-selected': {
                      color: '#fff', // Selected page number
                      backgroundColor: 'primary.main'
                    },
                    '& .MuiPaginationItem-ellipsis': {
                      color: '#fff' // Ellipsis color
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              {visions && visions.length > 0 ? (
                <VisionContainer>
                  {visions.map((visionProps, idx) => (
                    <Vision img key={idx} {...visionProps} />
                  ))}
                </VisionContainer>
              ) : (
                <div
                  id="no-camera-alert"
                  className="w-full h-96 col-span-2 bg-main-700 rounded-lg shadow-lg flex items-center justify-center "
                >
                  <p className="text-white text-center">No video stream selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Notification open={open} severity={severity} message={message} onClose={closeNotification} />
    </>
  )
}

export default App
