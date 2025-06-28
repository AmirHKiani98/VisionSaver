import "../assets/main.css";
import React from 'react';


const VisionContainer = (props) => {
    // Filter children to only include those of type Vision
    const visionChildren = React.Children.toArray(props.children).filter(
        child => child.type && child.type.name === 'Vision'
    );

    // Get the first Vision child
    const firstVisionChild = visionChildren[0];

    // Clone the first child and add/change className
    const firstVisionWithClass = firstVisionChild
        ? React.cloneElement(firstVisionChild, {
            className: (firstVisionChild.props.className || '') + ' your-custom-class'
        })
        : null;

    return (
        <div>
            {visionChildren.map((child, idx) =>
                React.cloneElement(child, {
                    className: (child.props.className || '') + ' your-custom-class',
                    key: child.key || idx
                })
            )}
        </div>
    );
};

export default VisionContainer;