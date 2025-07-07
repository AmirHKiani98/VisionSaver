import '../assets/main.css'
import splashBg from '../assets/traffic_splash_bg.jpg'
import { CircularProgress } from '@mui/material'

function Splash() {
  return (
    <div
      className="relative min-h-screen min-w-screen items-center justify-center bg-main-600 text-white"
      style={{ backgroundImage: `url(${splashBg})`, backgroundSize: 'cover' }}
    >
      <div
        className="absolute z-10 h-screen w-screen backdrop-blur-sm bg-white/30"
        style={{
          clipPath: 'polygon(0 0, 0 90%, 90% 0, 0 0)' // edit this to shape the diagonal
        }}
      ></div>
      <div
        className="absolute z-10 h-screen w-screen backdrop-blur-sm bg-white/30"
        style={{
          clipPath: 'polygon(20% 100%, 100% 100%, 100% 20%, 20% 100%)' // edit this to shape the diagonal
        }}
      ></div>

      <div className="absolute z-20 bottom-5 left-5">
        <div className="flex flex-row items-center gap-3">
          <CircularProgress />
          <p className="text-lg font-semibold">Starting server...</p>
        </div>
        <div className="text-sm mt-2">
          Photo by{' '}
          <a
            href="https://unsplash.com/@berkinuregen?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
            target="_blank"
            rel="noopener noreferrer"
          >
            Berkin Üregen
          </a>{' '}
          on{' '}
          <a
            href="https://unsplash.com/photos/traffic-light-under-blue-sky-during-daytime-gf9J4fyJKD0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unsplash
          </a>
        </div>
      </div>
    </div>
  )
}

export default Splash
