import React, { useRef, useState } from 'react';

const Video = ({ src: initialSrc }) => {
    const videoRef = useRef(null);
    const [src, setSrc] = useState(initialSrc);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <video
            ref={videoRef}
            src={src}
            onLoadedData={() => setLoading(false)}
            onError={(e) => {
                const videoEl = e.target;
                const errorObj = videoEl.error;
                if (errorObj && errorObj.code === 4) {
                    setSrc(src + '/?mp4=true'); // Attempt to reload with MP4 conversion
                } else {
                    setLoading(false);
                    setError(true);
                    if (errorObj) {
                        console.error('Video error:', errorObj, 'code:', errorObj.code, 'src:', src);
                    } else {
                        console.error('Unknown video error', e, 'src:', src);
                    }
                }
            }}
            className="block max-w-full max-h-[60vh] w-auto h-auto object-contain"
            style={{
                background: 'black',
                display: 'block',
                margin: 0,
                padding: 0
            }}
        />
    );
};

export default Video;