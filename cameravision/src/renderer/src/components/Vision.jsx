import React from 'react'
import { CircularProgress, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import ContextMenu from './ContextMenu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
const Vision = (props) => {
  const [src, setSrc] = React.useState(props.src || '')


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
                    if (error && error.code === 4) {
                      setSrc(src + '/?mp4=true')
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
