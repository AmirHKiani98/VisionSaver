import React from 'react'
import { CircularProgress, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import ContextMenu from './ContextMenu'
const Vision = (props) => {
  const [src, setSrc] = React.useState(props.src || '')
  // Expose setSrc to parent via ref if provided
  React.useEffect(() => {
    if (!props.streamViaWebSocket) return;

    setLoading(true);
    setError(false);

    const socket = new WebSocket(props.src);

    socket.onmessage = (event) => {
      // You should be sending base64-encoded JPEG data
      const base64Image = event.data;
      setSrc(`data:image/jpeg;base64,${base64Image}`);
      setLoading(false);
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setError(true);
    };

    socket.onclose = () => {
      console.warn("WebSocket closed.");
      setError(true);
    };

    return () => socket.close();
  }, [props.streamViaWebSocket]);
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
  const [errorCode, setErrorCode] = React.useState(0)

  React.useEffect(() => {
    setLoading(true)
    setError(false)
  }, [src])
  const videoRef = React.useRef(null)

  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  return (
    <ContextMenu
      menuItems={[
        { label: 'Delete', action: () => props.onRemove(props.id) },
        { label: 'Info', action: props.onInfo || (() => alert(`ID: ${props.id}\nSource: ${src}`)) }
      ]}
      className="relative !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center"
      contextMenuId={props.id}
    >
      <Button
        data-key={props.key || ''}
        className={`relative w-full h-full !bg-main-300 rounded-lg shadow-lg overflow-hidden flex items-center justify-center`}
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
          {props.img ? (
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
                    console.log(errorCode)
                    if (error.code === 4) {
                      setSrc(src + '/?mp4=true') // Attempt to reload with MP4 conversion
                    } else {
                      setLoading(false)
                      setError(true)
                      // Log detailed error info
                      if (error) {
                        console.error('Video error:', error, 'code:', error.code, 'src:', src)
                      } else {
                        console.error('Unknown video error', e, 'src:', src)
                      }
                    }
                  }}
                />
              </Link>
              <div
                variant="containd"
                size="small"
                className={`bg-main-400 p-1 ${loading ? ' invisible' : ''} active:bg-main-500`}
                onClick={handlePlayPause}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2
                }}
              >
                Play/Pause
              </div>
            </div>
          ) : null}
        </div>
      </Button>
    </ContextMenu>
  )
}

export default Vision
