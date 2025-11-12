import React from 'react'
import { CircularProgress, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import ContextMenu from './ContextMenu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
const Vision = (props) => {
  const [src, setSrc] = React.useState(props.src || '')
  const [displayedSrc, setDisplayedSrc] = React.useState(props.src || '')
  // props.ip is provided by the parent; local ip state not used
  const snapshotIntervalRef = React.useRef(null)
  const fetcherTimeoutRef = React.useRef(null)
  const bufferRef = React.useRef([]) // holds preloaded Image objects
  const firstFrameLoadedRef = React.useRef(false)

  React.useImperativeHandle(
    props.innerRef,
    () => ({
      setSrc
    }),
    [setSrc]
  )

  // Loading and error state for <img>
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isPlaying, setIsplaying] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    setError(false)
  }, [src])
  const videoRef = React.useRef(null)

  // Poll snapshot endpoint every 50ms when requested
  React.useEffect(() => {
    if (!props.snapshot) return
    if (!props.ip || !props.cameraId) return

    // start polling with a preloader Image to get clearer errors and avoid
    // rendering partial failed images. Use a small backoff when errors occur.
    setLoading(true)
    setError(false)

  const fetchInterval = Number(props.fetchInterval) || Number(props.snapshotInterval) || 50
  const displayInterval = Number(props.displayInterval) || 50
  const bufferMax = Number(props.bufferSize) || 5
  let fetchIntervalMs = fetchInterval
    let consecutiveErrors = 0
    let cancelled = false

    const loadSnapshot = () => {
      if (cancelled) return
      // don't overfill the buffer
      if (bufferRef.current.length >= bufferMax) return
      const url = `http://${props.ip}/api/v1/cameras/${props.cameraId}/snapshot?t=${Date.now()}`

      // Preload via Image element (avoids fetch/CORS issues) and push into buffer on load
      const img = new window.Image()
      img.decoding = 'async'
      if (props.snapshotWithCredentials) {
        img.crossOrigin = 'use-credentials'
      } else {
        img.crossOrigin = 'anonymous'
      }

      img.onload = () => {
        if (cancelled) return
        consecutiveErrors = 0
        fetchIntervalMs = fetchInterval
        // push into buffer (keep small FIFO)
        bufferRef.current.push(img)
        // if displayedSrc is empty (first frame), immediately display
        if (!displayedSrc) {
          const first = bufferRef.current.shift()
          if (first) {
            setDisplayedSrc(first.src)
            setLoading(false)
            setError(false)
            firstFrameLoadedRef.current = true
          }
        }
      }

      img.onerror = (ev) => {
        if (cancelled) return
        consecutiveErrors += 1
        setLoading(false)
        setError(true)
        console.warn(`Snapshot load error (#${consecutiveErrors})`, { url, ev })
        // exponential backoff (capped)
        fetchIntervalMs = Math.min(2000, fetchInterval * Math.pow(2, Math.min(consecutiveErrors, 6)))

        // diagnostic fetch to surface status codes when possible
        if (consecutiveErrors === 1) {
          fetch(url, { method: 'GET', credentials: props.snapshotWithCredentials ? 'include' : 'omit' })
            .then((res) => {
              console.info('Snapshot diagnostic fetch response', res.status, res.statusText, res.headers)
              return res.blob()
            })
            .then((blob) => console.info('Snapshot diagnostic fetch blob size', blob.size))
            .catch((ferr) => console.warn('Snapshot diagnostic fetch failed (likely CORS/mixed-content):', ferr))
        }
      }

      img.src = url
    }


    // start immediate load
    loadSnapshot()

    // fetcher: keep filling buffer
    const startFetcher = () => {
      if (cancelled) return
      loadSnapshot()
      fetcherTimeoutRef.current = setTimeout(startFetcher, fetchIntervalMs)
    }
    startFetcher()

    // display loop: pull from buffer and display at a steady rate
    let displayTimer = null
    const startDisplayLoop = () => {
      displayTimer = setInterval(() => {
        if (cancelled) return
        const nextImg = bufferRef.current.shift()
        if (nextImg) {
          setDisplayedSrc(nextImg.src)
          setLoading(false)
          setError(false)
          firstFrameLoadedRef.current = true
        } else {
          // buffer empty -> if we have already shown a first frame, keep showing it
          // otherwise show the loading indicator until the first frame arrives
          if (!firstFrameLoadedRef.current) {
            setLoading(true)
          } else {
            // keep loading false so the last displayed frame remains visible
            setLoading(false)
          }
        }
      }, displayInterval)
    }
    startDisplayLoop()

    return () => {
      cancelled = true
      if (fetcherTimeoutRef.current) {
        clearTimeout(fetcherTimeoutRef.current)
        fetcherTimeoutRef.current = null
      }
      if (snapshotIntervalRef.current) {
        clearTimeout(snapshotIntervalRef.current)
        snapshotIntervalRef.current = null
      }
      if (displayTimer) {
        clearInterval(displayTimer)
      }
      // clear buffer
      bufferRef.current.length = 0
    }
  }, [props.snapshot, props.ip, props.cameraId])

  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      setIsplaying(true)
      videoRef.current.play()
    } else {
      setIsplaying(false)
      videoRef.current.pause()
    }
  }

  return (
    <ContextMenu
      menuItems={[
        { label: 'Delete', action: () => props.onRemove(props.src) },
        { label: 'Info', action: props.onInfo || (() => alert(`ID: ${props.id}\nSource: ${src}`)) }
      ]}
      // className="relative !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center"
      contextMenuId={props.id}
    >
      <Button
        data-key={props.key || ''}
        className={`relative w-full h-full ${props.finished_detecting ? '!bg-green-400' : '!bg-main-300'} rounded-lg shadow-lg overflow-hidden flex items-center justify-center !p-0`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {loading && !error && (
            <div className="absolute w-full h-full flex justify-center items-center">
              <CircularProgress className="w-full h-full" color="secondary" />
            </div>
          )}
          {error && (
            <div className="absolute w-full h-full flex justify-center items-center">
              <div className="text-red-600 text-center p-2">Stream unavailable</div>
            </div>
          )}
          {props.snapshot ? (
            <img
              className="w-full h-full"
              id={props.id}
              src={displayedSrc}
              alt="Vision Snapshot"
              style={{ display: loading || error || !displayedSrc ? 'none' : 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
            />
          ) : props.img ? (
            <img
              className="w-full h-full"
              id={props.id}
              src={src}
              alt="Vision"
              style={{ display: loading || error ? 'none' : 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
            />
          ) : props.video ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <Link to={`/record?record_id=${props.id}&token=${props.token}`}>
                <video
                  className="w-full h-full object-contain"
                  id={props.id}
                  src={src}
                  ref={videoRef}
                  controls={false}
                  autoPlay={false}
                  style={{ display: loading || error ? 'none' : 'block', pointerEvents: 'none' }}
                  onLoadedData={() => setLoading(false)}
                  onError={(e) => {
                    const videoEl = e.target
                    const error = videoEl.error
                    if (error && error.code === 4) {
                      // replace mp4 with mkv in src
                      setSrc(src.replace('mp4', 'mkv'))
                    } else {
                      setLoading(false)
                      setError(true)
                      if (error) {
                        console.error('Video error:', error, 'code:', error.code, 'src:', src)
                      } else {
                        console.error('Unknown video error', e, 'src:', src)
                      }
                    }
                  }}
                />
              </Link>
              {/* <div
                size="small"
                className={`bg-main-400${loading ? ' invisible' : ''} active:bg-main-500`}
                onClick={handlePlayPause}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2
                }}
              >
                
              </div> */}
              <div
                className={`bg-main-400 z-10 shadow-lg rounded-sm opacity-60 left-1/2 -translate-x-1/2 absolute bottom-1 ${loading ? ' invisible' : ''} active:bg-main-500 !min-w-0 px-5`}
                onClick={handlePlayPause}
                
              >
                {!isPlaying ? (
                  <FontAwesomeIcon icon={faPlay} className="text-white" />
                ) : (
                  <FontAwesomeIcon icon={faStop} className="text-white" />
                )}
                </div>
            </div>
          ) : null}
        </div>
      </Button>
    </ContextMenu>
  )
}

export default Vision
