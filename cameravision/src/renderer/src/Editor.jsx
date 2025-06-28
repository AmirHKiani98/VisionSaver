import React from 'react';

function Editor() {
    return (
        <>
        <div className='w-screen h-screen grid grid-cols-2 grid-rows-2 gap-2.5 p-5'>
            <div className='bg-main-400 rounded-lg shadow-lg flex items-center justify-center'>
                {/* Content for cell 1 */}
            </div>
            <div className='bg-main-400 rounded-lg shadow-lg flex items-center justify-center'>
                {/* Content for cell 2 */}
            </div>
            <div className='bg-main-400 rounded-lg shadow-lg flex items-center justify-center'>
                {/* Content for cell 3 */}
            </div>
            <div className='bg-main-400 rounded-lg shadow-lg flex items-center justify-center'>
                {/* Content for cell 4 */}
            </div>
        </div>
        </>
    );
}

export default Editor;