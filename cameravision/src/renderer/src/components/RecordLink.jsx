import '../assets/main.css'
import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from '@mui/material'
import LinearProgressWithLabel from './LinearProgressWithLabel'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import ContextMenu from './ContextMenu'
import dayjs from 'dayjs'

const RecordLink = (props) => {
  const onRemove = props.onRemove || (() => {})
  const [recordsId, setRecordsId] = React.useState(props.recordsId || [])
  const [progresses, setProgresses] = React.useState({})
  const [env, setEnv] = React.useState(null)
  const [sockets, setSockets] = React.useState({})
  const [webhookRunning, setWebhookRunning] = React.useState(false)
  const [webhook, setWebhook] = React.useState(null)
  const [intersectionsNames] = React.useState(props.intersectionsNames || [])

  const recordLinkContextMenuItems = [
    { label: 'Delete', action: () => onRemove(props.id) },
    {
      label: 'Edit',
      action: () => {
        if (props.modalHandler && props.modalRecordLinkTokenSetter) {
          props.modalRecordLinkTokenSetter(props.token)
          props.modalHandler(true)
          if (props.setEditTime && props.setEditDuration) {
            props.setEditTime(dayjs(props.startTime))
            props.setEditDuration(props.duration)
          }
        }
      },
    },
    { label: 'Info', action: () => alert(`ID: ${props.id}\nStart Time: ${props.startTime}\nDuration: ${props.duration}\nIP: ${props.ip}`) },
  ]

  React.useEffect(() => {
    if (!props.recordsId) return
    const progressDict = {}
    props.recordsId.forEach((id) => { progressDict[id] = { progress: 0, recording: false, converting: false } })
    setRecordsId(props.recordsId)
    setProgresses(progressDict)
  }, [props.recordsId])

  React.useEffect(() => { window.env.get().then(setEnv) }, [])

  const runWebhook = () => {
    if (!props.isInMainPage) return
    recordsId.forEach((recordId) => {
      const ws = new WebSocket(`ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.WEBSOCKET_RECORD_PROGRESS}/${recordId}/`)
      setSockets((prev) => ({ ...prev, [recordId]: ws }))
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.progress !== undefined) {
          setProgresses((prev) => ({ ...prev, [recordId]: { progress: data.progress * 100, recording: data.recording || false, converting: data.converting || false } }))
        }
      }
      ws.onerror = (err) => console.error(`WebSocket error on recordId ${recordId}`, err)
      ws.onclose = () => console.log(`WebSocket closed for recordId ${recordId}`)
    })
  }

  React.useEffect(() => {
    if (!env?.BACKEND_SERVER_DOMAIN || !env?.BACKEND_SERVER_PORT || !env?.WEBSOCKET_RECORD_PROGRESS || !props.inProcess) return
    setInterval(() => { if (!webhookRunning) { runWebhook(); setWebhookRunning(true) } }, 3000)
    return () => { if (webhook) Object.values(sockets).forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.close() }) }
  }, [env, props.inProcess, recordsId])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    if (isNaN(date)) return ''
    const pad = (n) => n.toString().padStart(2, '0')
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const isRecording = props.inProcess
  const isDone = props.done
  const accentColor = isRecording ? '#ef4444' : isDone ? '#22c55e' : '#f59e0b'

  const statusBadge = isRecording ? (
    <span className="status-pill bg-red-50 text-red-600 border border-red-200">
      <RadioButtonCheckedIcon sx={{ fontSize: 10 }} className="animate-pulse" /> Recording
    </span>
  ) : isDone ? (
    <span className="status-pill bg-teal-50 text-teal-700 border border-teal-200">
      <CheckCircleOutlineIcon sx={{ fontSize: 10 }} /> {props.finishedDetectingAll ? 'Detected' : 'Done'}
    </span>
  ) : (
    <span className="status-pill bg-amber-50 text-amber-700 border border-amber-200">
      <AccessAlarmIcon sx={{ fontSize: 10 }} /> Scheduled
    </span>
  )

  return (
    <ContextMenu menuItems={recordLinkContextMenuItems} contextMenuId={`record-link-${props.token}`}>
      <div
        className="relative flex flex-col gap-2 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
        style={{ borderLeft: `3px solid ${accentColor}` }}
      >
        {/* Status + actions row */}
        <div className="flex items-center justify-between">
          {statusBadge}
          <div className="flex items-center gap-1.5">
            {props.modalHandler && (
              <Tooltip title="Edit" placement="top">
                <button
                  className="icon-btn !w-7 !h-7 text-main-200 hover:text-white"
                  onClick={() => {
                    if (props.modalRecordLinkTokenSetter) props.modalRecordLinkTokenSetter(props.token)
                    props.modalHandler(true)
                    if (props.setEditTime) props.setEditTime(dayjs(props.startTime))
                    if (props.setEditDuration) props.setEditDuration(props.duration)
                  }}
                >
                  <EditIcon sx={{ fontSize: 13 }} />
                </button>
              </Tooltip>
            )}
            <Tooltip title="Delete" placement="top">
              <button className="icon-btn !w-7 !h-7 text-main-200 hover:text-red-400" onClick={onRemove}>
                <DeleteIcon sx={{ fontSize: 13 }} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Metadata row */}
        <Link
          to={isDone ? `/editor?token=${props.token}` : '#'}
          className={isDone ? 'cursor-pointer' : 'cursor-not-allowed pointer-events-none'}
          tabIndex={isDone ? 0 : -1}
        >
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-main-200 text-xs mb-0.5">Start</p>
              <p className="text-white font-medium leading-tight">{formatDateTime(props.startTime)}</p>
            </div>
            <div>
              <p className="text-main-200 text-xs mb-0.5">Duration</p>
              <p className="text-white font-medium">{props.duration} min</p>
            </div>
            <div>
              <p className="text-main-200 text-xs mb-0.5">IP</p>
              <p className="text-white font-medium truncate">{props.ip}</p>
            </div>
          </div>
          {intersectionsNames.length > 0 && (
            <p className="text-main-300 text-xs mt-1 truncate">{intersectionsNames.join(', ')}</p>
          )}
        </Link>

        {/* Progress bars while recording */}
        {isRecording && (
          <div className="flex flex-col gap-1 mt-1">
            {recordsId.map((recordId) => {
              const p = progresses[recordId] || {}
              return p.hasOwnProperty('progress') ? (
                <LinearProgressWithLabel
                  key={recordId}
                  value={p.progress || 0}
                  className="bg-main-500"
                  color="success"
                  recording={p.recording || undefined}
                  converting={p.converting || undefined}
                />
              ) : null
            })}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}

export default RecordLink
