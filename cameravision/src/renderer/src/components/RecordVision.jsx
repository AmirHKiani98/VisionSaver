import react from 'react';
import ReactPlayer from 'react-player';
function RecordVision(props) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <ReactPlayer
                url={props.src}
                controls={true}
                width="100%"
                height="100%"
                playing={true}
                onError={(e) => console.error('Error loading video:', e)}
            />
        </div>
    );
}

export default RecordVision;