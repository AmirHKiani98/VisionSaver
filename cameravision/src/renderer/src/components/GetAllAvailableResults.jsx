import {Typography, Button } from "@mui/material";


export default function GetAllAvailableResults(){
    return (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[800px] bg-main-500 shadow-2xl p-10 rounded-lg flex flex-col gap-5 max-h-[80vh] overflow-auto">
            <Typography className="!text-xl !font-bold text-white">
                Download All Available Results
            </Typography>
            <div className="flex flex-row justify-between items-center">
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    variant="contained"
                    className="!bg-main-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                >
                    <FontAwesomeIcon icon={faCloudArrowDown} className="text-white" />
                    <VisuallyHiddenInput
                        type="file"
                        accept="video/*"
                        onChange={handleFiles}
                        multiple
                    />
                </Button>
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    disabled={videos.length === 0}
                    variant="contained"
                    onClick={uploadVideos}
                    className="!bg-green-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                >
                    <FontAwesomeIcon icon={faCheck} className="text-white" />
                    
                </Button>
            </div>
            
            <Notification open={open} severity={severity} message={message} onClose={closeNotification} autoHideDuration={autoHideDuration} />
        </div>)
}