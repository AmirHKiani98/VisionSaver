import React from 'react';
import './assets/main.css';
import Vision from './components/Vision';
import VisionContainer from './components/VisionContainer';
import {
    Button,
    Link
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

function Editor({ visions }) {
    return (
        <>
        <div className='w-screen h-screen flex flex-col'>
            <div className='flex items-center p-2.5 gap-2.5'>
                <Link href="/">
                    <Button className="!bg-main-500 !p-2.5 !w-10">
                        <FontAwesomeIcon icon={faChevronLeft} className='text-white' />
                    </Button>
                </Link>
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