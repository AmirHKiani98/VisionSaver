import React, { useRef } from 'react';

const Video = React.forwardRef((props, ref) => {

    return (
        <video
            ref={ref}
            src={props.src}
            onLoadedData={() => props.setLoading(false)}
            onError={(e) => {
                const videoEl = e.target;
                const errorObj = videoEl.error;
                if (errorObj && errorObj.code === 4) {
                    setSrc(src + '/?mp4=true'); // Attempt to reload with MP4 conversion
                } else {
                    props.setLoading(false);
                    props.setError(true);
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
});

export default Video;