import React, { useRef } from 'react';

const Video = React.forwardRef((props, ref) => {
    const {
        src,
        setLoading,
        setError,
        ...rest
    } = props;

    return (
        <video
            ref={ref}
            src={src}
            onLoadedMetadata={props.onLoadedMetadata}
            onTimeUpdate={props.onTimeUpdate}
            onLoadedData={() => setLoading && setLoading(false)}
            onError={(e) => {
                const videoEl = e.target;
                const errorObj = videoEl.error;
                if (errorObj && errorObj.code === 4) {
                    // setSrc(src + '/?mp4=true'); // Only if you have setSrc in scope
                } else {
                    setLoading && setLoading(false);
                    setError && setError(true);
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
            {...rest}
        />
    );
});

export default Video;