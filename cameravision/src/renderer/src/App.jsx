import './assets/main.css'
import { useState, useEffect, useId } from 'react'

// Material Tailwind
import { Button } from '@material-tailwind/react'

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo,
  faClockRotateLeft,
  faRecordVinyl,
  faDownload,
  faEdit,
  faXmark,
  faLock,
  faUnlock,
  faCloudArrowDown
} from '@fortawesome/free-solid-svg-icons'
import { BrowserUpdated } from "@mui/icons-material"
import { useRef } from 'react';
// MUI - Pickers
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import GetAllAvailableResults from "./components/GetAllAvailableResults"

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
  Tooltip,
  Autocomplete,
  CircularProgress,
  Modal
} from '@mui/material'

import dayjs from 'dayjs'
import Vision from './components/Vision' // Assuming Vision is a component that displays video streams
import VisionContainer from './components/VisionContainer'

import Notification from './components/Notification'
import RecordLink from './components/RecordLink'
import ImportComponent from './Import'
const today = dayjs()
const oneHourFromNow = today.add(1, 'hour')

function App() {
  const recordLinksPerPage = 3
  const [startRecordLinkIndex, setStartRecordLinkIndex] = useState(0)
  const [time, setTime] = useState(oneHourFromNow)
  const [protocol, setProtocol] = useState('RTSP')
  const [isGetAllAvailableResultsExcelOpen, setIsGetAllAvailableResultsExcelOpen] = useState(false)
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
  const [counter, setCounter] = useState(0)
  const [options, setOptions] = useState([]);  // To store filtered options
  const [query, setQuery] = useState('CSAH');      // To store current input value
  const [optionId, setOptionId] = useState(0); // To store the ID of the selected option
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [isRecordLinkEditModalOpen, setIsRecordLinkEditModalOpen] = useState(false)
  const [currentRecordLinkEditToken, setCurrentRecordLinkEditToken] = useState(null)
  const [editTime, setEditTime] = useState(null)
  const [editDuration, setEditDuration] = useState(30) // Default edit duration in minutes
  const [isLocked, setIsLocked] = useState(false)
  const [autoHideDuration, setAutoHideDuration] = useState(3000) // Default auto-hide duration for notifications
  const lockButtonRef = useRef(null);
  const [shouldAddCronJob, setShouldAddCronJob] = useState(false)
  const [isImportRecordModalOpen, setIsImportRecordModalOpen] = useState(false)
  const [loadingRecords, setLoadingRecords] = useState(true);
  const getQuery = new URLSearchParams(location.search);
  const currentPage = parseInt(getQuery.get('page')) || 1;
  const recordLinkEditModalHandler = () => {
    setIsRecordLinkEditModalOpen(!isRecordLinkEditModalOpen)
  }

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
    // Calculate the starting index based on the currentPage
    const newIndex = (currentPage - 1) * recordLinksPerPage;
    setStartRecordLinkIndex(newIndex);
  }, [currentPage, recordLinksPerPage]);

  // And also ensure the query param is set correctly on initial load
  useEffect(() => {
    if (!getQuery.has('page')) {
      getQuery.set('page', '1');
      history.pushState({}, '', `?${getQuery.toString()}`);
    }
  }, []);

  useEffect(() => {
    if (!env || !env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT || !env.API_GET_IPS) {
      return; // Return early if env is not set or API endpoint is missing
    }

    if (query.length > 2) {
      // Fetch matching data when query length is greater than 2
      fetch(`http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_IPS}?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched data:', data);
          // Assuming the API response contains arrays of names and corresponding ips
          
            const combinedOptions = data.name.map((name, index) => ({
            id: optionId + index + 1,
            name,
            ip: data.ip[index]
            }));
            setOptionId(optionId + data.name.length); // Update optionId for next fetch
        

          setOptions(combinedOptions); // Set options to the list of matching rows
          console.log('Fetched options:', combinedOptions);
        })
        .catch(error => {
          console.error('Error fetching options:', error);
        });
    } else {
      setOptions([]);
    }
  }, [query, env]);

  useEffect(() => {
    // Define the function to be executed every 5 seconds
    if (!env){
      return () => {} // Return early if env is not set
    }
    const myIntervalFunction = () => {
      setCounter(prevCounter => prevCounter + 1); // Example: update state
      const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.GET_RECORD_STATUS}/`
      const notDoneRecords = recordLinks.filter(record => !record.done)
      // No console output here since Electron renderer may not show logs in some setups
      for (const record of notDoneRecords) {
        fetch(`${url}${record.token}`)
          .then(response => response.json())
          .then(data => {
            if (data.status && data.status !== 200) {
              // Optionally show notification for error
              console.error(`Error fetching record status for ${record.startTime}:`, data.message || 'Unknown error')
              return
            }

            if (data.done && !record.done) {
              setRecordLinks(prev => prev.map(r => r.token === record.token ? { ...r, done: true, inProcess: false } : r))
              openNotification('success', `Recording for ${record.startTime} completed successfully.`)
            }

            if (data.in_process && !record.inProcess) {
              setRecordLinks(prev => prev.map(r => r.token === record.token ? { ...r, inProcess: true } : r))
              openNotification('info', `Recording for ${record.startTime} is in process.`)
            }
            
          })
          .catch(() => {
            // Optionally show notification for fetch error
          })
      }
    };

    // Set up the interval
    const intervalId = setInterval(myIntervalFunction, 5000); // 5000 milliseconds = 5 seconds

    // Clean up the interval when the component unmounts or dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [env.BACKEND_SERVER_DOMAIN, env.BACKEND_SERVER_PORT, env.GET_RECORD_STATUS, recordLinks]); // Only use stable primitive dependencies

  useEffect(() => {
    setLoadingRecords(true);
    if (env.BACKEND_SERVER_DOMAIN && env.BACKEND_SERVER_PORT && env.API_GET_RECORD_SCHEDULE) {
      const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_RECORD_SCHEDULE}`
      fetch(apiLink)
        .then((res) => res.json())
        .then((data) => {
          setLoadingRecords(false);
          if (Array.isArray(data)) {
            // camera_url should be changed to cameraUrl
            data = data.map((record) => ({
              ...record,
              recordsId: record.records_id || [], // Ensure recordsId is set correctly
              cameraUrl: record.camera_url || record.cameraUrl // Ensure cameraUrl is set correctly
            }))
            console.log(data);
            setRecordLinks(data)
          } else if (data.records) {
            console.log('Fetched records:', data.records)
            const records = data.records
              .map((record) => ({
              ...record,
              cameraUrl: record.camera_url || record.cameraUrl, // Ensure cameraUrl is set correctly
              startTime: record.start_time || record.startTime,
              inProcess: record.in_process || record.inProcess,
              recordMinId: record.record_min_id || record.recordMinId,
              recordMaxId: record.record_max_id || record.recordMaxId,
              finishedDetectingAll: record.finished_detecting_all || record.finishedDetectingAll,
              ip: record.ip || [], // Bad naming. It should have been ips
              recordsId: record.records_id || [], // Ensure recordsId is set correctly
              }))
              .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
            console.log('Fetched records:', records)
            setRecordLinks(records)
          } else {
            setRecordLinks([])
          }
        })
        .catch((e) => {
          console.error('Error fetching record schedule:', e)
          setRecordLinks([])
          setLoadingRecords(false);
        })
    }
  }, [env])
  const openNotification = (severity, message) => {
    setSeverity(severity)
    setMessage(message)
    setOpen(true)
  }
  const addStream = (cameraUrl, id, index) => {
    setLoadingVideos(false);
    const streamUrl = `http://${env.STREAM_SERVER_DOMAIN}:${env.STREAM_SERVER_PORT}/${env.MJPEG_STREAM_URL}/?url=${cameraUrl}`
    const parts = String(id).split('-')
    const cameraId = parts[1] ?? parts[0] ?? ''
    const newVisionInfo = {
      src: streamUrl,
      ip: ip,
      cameraUrl: cameraUrl,
      id: `camera-${id}`,
      cameraId: cameraId,
      onRemove: removeStreamHandler
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
    setLoadingVideos(true)
    if (channel === 'quad') {
      // Assuming "quad" means the intersection has four cameras: cam1, cam2, cam3 and cam4
      
      for (let i = 1; i <= 4; i++) {
        const cameraUrl = `${protocolLower}://${ip}/cam${i}`
        
        getResolvedUrl(cameraUrl).then((resolvedUrl) => {
          if (resolvedUrl) {
            console.log(`Resolved URL for cam${i}:`, resolvedUrl)
            addStream(resolvedUrl, `${ip}-${i}`)
          }
        })
        
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


  const downloadDB = () => {
    if (!env.BACKEND_SERVER_DOMAIN || !env.BACKEND_SERVER_PORT || !env.API_DOWNLOAD_DB) {
      openNotification('error', 'Backend server domain, port, or API endpoint is not set.')
      return
    }
    const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_DOWNLOAD_DB}`
    fetch(apiLink)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.blob()
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'db.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        openNotification('error', 'Failed to download database.')
      })
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
    var listOfIps = visions.map((vision) => vision.ip).filter((ip) => ip !== undefined && ip !== null && ip !== '')
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
    // Only keep unique IPs in listOfIps
    const uniqueIps = Array.from(new Set(listOfIps));
    setRecordLinks((prev) => [
      {
      startTime: startTime,
      duration: duration,
      token: randomString,
      ip: uniqueIps,
      intersectionsNames: query,
      },
      ...prev
    ])
  }
  const removeStreamHandler = (src) => {
    // Remove the vision at index posIndex
    
    setVisions((prev) => prev.filter((item, index) => item.src !== src))
    openNotification('success', `Camera stream with id ${src} deleted.`)
  }

  const handleEditRecordLink = () => {
    if (!editTime || !editDuration) {
      openNotification('error', 'Please select a start time and duration.')
      return
    }
    // Check if the time is in the past
    if (editTime.isBefore(dayjs())) {
      openNotification('error', 'Start time cannot be in the past.')
      return
    }
    // Check if the duration is a positive number
    if (editDuration <= 0) {
      openNotification('error', 'Duration must be a positive number.')
      return
    }
    const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_EDIT_RECORD}`
    const data = {
      token: currentRecordLinkEditToken,
      start_time: editTime.toISOString(),
      duration: editDuration
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
          openNotification('error', data.message || 'Failed to edit record link.')
          return
        }
        setIsRecordLinkEditModalOpen(false)
        openNotification('success', 'Record link edited successfully.')
        setRecordLinks((prev) =>
          prev.map((record) =>
            record.token === currentRecordLinkEditToken
              ? { ...record, startTime: editTime.toISOString(), duration: editDuration }
              : record
          )
        )
      })
      .catch((error) => {
        openNotification('error', 'Failed to edit record link.')
      })
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

  const setTurnOnMode = () => {
    if (!isLocked) {
      window.api.keepMeAlive();
      setIsLocked(true);
      setAutoHideDuration(10000);
      openNotification('info', 'Keep-alive mode enabled. Press Ctrl+L (or Cmd+L on Mac) to toggle.');
    } else {
      setAutoHideDuration(3000);
      window.api.stopKeepingMeAlive();
      setIsLocked(false);
      openNotification('info', 'Keep-alive mode disabled. Press Ctrl+L (or Cmd+L on Mac) to enable again.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // For Mac: metaKey, for Windows/Linux: ctrlKey
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setTurnOnMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked]);

  const handleInputChange = (_, newInputValue) => {
    // Update the query when the input changes
    setQuery(newInputValue);
  };

  useEffect(() => {
    if (shouldAddCronJob) {
      addCronJob();
      setShouldAddCronJob(false);
    }
  }, [time, shouldAddCronJob]);

  return (
    <div className='flex flex-col justify-between min-h-screen min-w-full'>
      <div className="min-h-full min-w-full flex px-5 py-2.5">
        <div className="text-white flex flex-col w-full items-center gap-2">
          <div className="flex flex-row justify-between items-center w-full mb-2.5">
            <div className="flex flex-row gap-2.5 items-center">
              <Tooltip title="Download all the results" placement="bottom"
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 5],
                        },
                      },
                    ],
                  }
                }}
              >
                <Button variant="contained" className='bg-main-400 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700' onClick={()=>{setIsGetAllAvailableResultsExcelOpen(true)}}>
                  <FontAwesomeIcon icon={faDownload} />
                </Button>
              </Tooltip>
              {/* <Tooltip title="Download all the results" placement="right" >
                <Button variant="contained" className='bg-main-400 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700' onClick={()=>{setIsGetAllAvailableResultsExcelOpen(true)}}>
                  <BrowserUpdated />
                </Button>

              </Tooltip> */}
            </div>
            <Typography className="text-white text-2xl font-bold">
              CameraVision
            </Typography>
            <Tooltip title="Add Camera Stream" placement="left"
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 5],
                      },
                    },
                  ],
                }
              }}>
            <Button
              ref={lockButtonRef} 
              variant="contained"
              className='bg-main-400 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700'
              onClick={() => setTurnOnMode()
              }
              >
              {isLocked ? (
                <FontAwesomeIcon icon={faLock} />
              ) : (
                <FontAwesomeIcon icon={faUnlock} />
              )}
            </Button>
            </Tooltip>
          </div>
          <div className="flex-col md:flex md:flex-row w-full gap-10">
            <div className="flex flex-col w-full lg:w-2/3 gap-5">
              <form
                id="camera-stream-form"
                className="flex flex-col justify-between w-full"
                action="#"
              >
                <div className='flex flex-col gap-2.5 rounded-lg'>
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
                  <div className='flex items-center justify-center gap-2.5'>  
                    <Typography className="text-white">
                      Or
                    </Typography>

                  </div>
                  <div className=''>
                    <Autocomplete
                      value={ip || ''}  // Ensure that ip is always a string, fallback to an empty string if undefined
                      onChange={(_, newValue) => setIp(newValue?.ip || '')}  // Set ip to the corresponding IP when an option is selected
                      inputValue={query} // Keep the input value in sync with state
                      onInputChange={(_, newInputValue) => setQuery(newInputValue)}  // Track input change
                      options={options || []}  // Ensure options is always an array
                      className="bg-main-400 rounded-md w-full"
                      getOptionLabel={(option) => option?.name || ''}  // Show the name in the input field
                      renderInput={(params) => <TextField {...params} className='!text-white !font-bold' label="Search IPs" />}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {option.name} - {option.ip}
                        </li>
                      )}
                    />
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
                      minTime={
                        time && time.isSame(today, 'day')
                          ? dayjs()
                          : undefined
                      }
                    />
                    </LocalizationProvider>
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
                  
                </div>
                <div className="flex justify-between items-center gap-2.5">
                  <Tooltip title="Start Recording Right Away" placement="right">
                    <Button
                      id="submit-start-recording"
                      className="bg-red-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-red-700"
                      onClick={() => {
                        setTime(dayjs().add(5, 'seconds'));
                        setShouldAddCronJob(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faRecordVinyl} />
                    </Button>
                  </Tooltip>
                  <div className='flex flex-row items-center justify-center gap-2.5'>
                    <Tooltip title="Add Cron Job for Recording" placement="top">
                      <Button
                        id="submit-add-cronjob"
                        className="bg-yellow-600 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-yellow-700"
                        onClick={addCronJob}
                      >
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Import Recordings" placement="top">
                      <Button
                        id="submit-import-recordings"
                        className="bg-yellow-600 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-yellow-700"
                        onClick={() => {
                          setIsImportRecordModalOpen(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faCloudArrowDown} />
                      </Button>
                    </Tooltip>
                  </div>
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
                
                {loadingRecords ? (
                  <ListItem className="!bg-main-700 text-white rounded-lg shadow-lg">
                    <CircularProgress size={24} className="mr-2" /> Loading records...
                  </ListItem>
                ) : recordLinks.length === 0 ? (
                  <ListItem className="!bg-main-700 text-white rounded-lg shadow-lg">
                    No records found
                  </ListItem>
                ) : (
                  recordLinks
                    .slice(startRecordLinkIndex, startRecordLinkIndex + recordLinksPerPage)
                    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                    .map((record, idx) => {
                      const isFirst = idx === 0;
                      const isLast =
                        idx === Math.min(recordLinksPerPage, recordLinks.length - startRecordLinkIndex) - 1;
                      let roundedClass = '';
                      if (isFirst) roundedClass += ' rounded-t-md';
                      if (isLast) roundedClass += ' rounded-b-md';

                      return (
                        <RecordLink
                          token={record.token}
                          startTime={record.startTime}
                          duration={record.duration}
                          finishedDetectingAll={record.finishedDetectingAll}
                          key={record.token} // Use record.token as the unique key
                          roundedClass={roundedClass}
                          onRemove={() => onRemoveRecord(record.token)}
                          inProcess={record.inProcess}
                          recordsId={record.recordsId}
                          recordMinId={record.recordMinId}
                          recordMaxId={record.recordMaxId}
                          done={record.done}
                          ip={record.ip}
                          modalHandler={recordLinkEditModalHandler}
                          modalRecordLinkTokenSetter={setCurrentRecordLinkEditToken}
                          setEditTime={setEditTime}
                          setEditDuration={setEditDuration}
                          intersectionsNames={record.intersection || []}
                        />
                      );
                    })
                )}
              </List>
              <div className="flex justify-center p-2.5">
                <Pagination
                  count={Math.ceil(recordLinks.length / recordLinksPerPage)}
                  page={currentPage}
                  onChange={(event, value) => {
                    const newIndex = (value - 1) * recordLinksPerPage
                    setStartRecordLinkIndex(newIndex)
                    getQuery.set('page', value)
                    history.pushState({}, '', `?${getQuery.toString()}`)
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
            <div className="w-full lg:w-1/3 min-h-full overflow-auto">              {visions && visions.length > 0 ? (
                <VisionContainer>
                  {visions.map((visionProps, idx) => (
                    <Vision img key={visionProps.id} {...visionProps} snapshot />
                  ))}
                </VisionContainer>
              ) : (
                loadingVideos ? (
                  <div
                    id="no-camera-alert"
                    className="w-full h-96 col-span-2 bg-main-700 rounded-lg shadow-lg flex items-center justify-center "
                  >
                    <CircularProgress className="text-white" />
                  </div>
                ) : (
                  <div
                    id="no-camera-alert"
                    className="w-full h-96 col-span-2 bg-main-700 rounded-lg shadow-lg flex items-center justify-center "
                  >
                    <p className="text-white text-center">No video stream selected</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Notification open={open} severity={severity} message={message} onClose={closeNotification} autoHideDuration={autoHideDuration} />
      <Modal
          open={isRecordLinkEditModalOpen}
          onClose={() => recordLinkEditModalHandler(false)}
          aria-labelledby="parent-modal-title"
          aria-describedby="parent-modal-description"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[400px] bg-main-500 shadow-2xl p-5 rounded-lg flex flex-col gap-5">
            <div className="flex flex-row gap-2.5">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        className="bg-main-400 rounded-md w-2/5"
                        color="primary.white"
                        label={<Typography className="text-white">Start Date</Typography>}
                        slotProps={{
                          field: { clearable: false, onClear: () => setCleared(true) }
                        }}
                        minDate={today}
                        value={editTime}
                        onChange={(newValue) => {
                          if (newValue) {
                            setEditTime(newValue.hour(editTime.hour()).minute(editTime.minute()))
                          }
                        }}
                      />
                      <TimePicker
                        className="bg-main-400 w-2/5 rounded-md"
                        label={<Typography className="text-white">Start Time</Typography>}
                        value={editTime}
                        onChange={setEditTime}
                        minTime={
                            editTime && editTime.isSame(today, 'day')
                            ? dayjs()
                            : undefined
                          }
                      />
                </LocalizationProvider>
                        <TextField
                      id="outlined-number"
                      type="number"
                      className="bg-main-400 w-1/5 rounded-md"
                      slotProps={{
                        inputLabel: {
                          shrink: true
                        }
                      }}
                      value={editDuration}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value >= 0) {
                          setEditDuration(value)
                        } else {
                          openNotification('error', 'Duration must be a positive number.')
                        }
                      }}
                      label={<Typography className="text-white">Duration (minutes)</Typography>}
                    />
              </div>
              <div className='flex justify-between items-center'>
                      <Button
                        variant="contained"
                        className='bg-main-400 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-main-700'
                        onClick={() => {
                          handleEditRecordLink()
                        }
                      }
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="contained"
                        className='bg-red-500 rounded-lg shadow-xl p-2.5 w-10 active:shadow-none active:bg-red-700'
                        onClick={() => {
                          setIsRecordLinkEditModalOpen(false)
                          setCurrentRecordLinkEditToken(null)
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </Button>
              </div>
            
          </div>
        </Modal>
        <Modal
          open={isImportRecordModalOpen}
          onClose={() => setIsImportRecordModalOpen(false)}
          aria-labelledby="parent-modal-title"
          aria-describedby="parent-modal-description"
        >
            <ImportComponent></ImportComponent>
        </Modal>
        <Modal
            open={isGetAllAvailableResultsExcelOpen}
            onClose={() => setIsGetAllAvailableResultsExcelOpen(false)}
            aria-labelledby="parent-modal-title2"
            aria-describedby="parent-modal-description"
          >
          <GetAllAvailableResults onClose={() => {setIsGetAllAvailableResultsExcelOpen(false)}}></GetAllAvailableResults>
        </Modal>
    </div>
  )
}

export default App
