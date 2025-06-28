import React from 'react';
import './assets/output.css';
import Vision from './components/Vision';
import VisionContainer from './components/VisionContainer';
import {
    Button
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronCircleLeft } from '@fortawesome/free-solid-svg-icons';
function Editor({ visions }) {
    return (
        <>
        <div className='w-screen h-screen flex flex-col'>
            <div className='flex items-center p-2.5'>
                <Button className="bg-main-500">
                    <FontAwesomeIcon icon={faChevronCircleLeft} className='text-white text-2xl' />
                </Button>
                <h1 className='text-white text-2xl font-bold'>Camera Vision Editor</h1>
            </div>
            <VisionContainer>
                {visions && visions.length > 0 ? (
                    visions.map((visionProps, idx) => (
                        <Vision key={idx} {...visionProps} />
                ))
                ) : (
                    <div className="text-white text-center w-full py-10">No visions available.</div>
                )}
            </VisionContainer>
            </div>
        </>
    );
}

export default Editor;