import "../assets/main.css";
import React from 'react';


const VisionContainer = (props) => {
    // Filter children to only include those of type Vision
    const visionChildren = React.Children.toArray(props.children).filter(
        child => child.type && child.type.name === 'Vision'
    );


    return (
        <div className='flex-1 grid grid-cols-2 grid-rows-2 gap-2.5 p-5 w-full h-80'>
            {visionChildren.map((child, idx) =>
                React.cloneElement(child, {
                    className: (child.props.className || ''),
                    key: child.key || idx
                })
            )}
        </div>
    );
};

export default VisionContainer;