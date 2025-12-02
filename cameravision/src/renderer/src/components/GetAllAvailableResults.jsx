import {Typography, Button, LinearProgress, FormControl, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import { Close, BrowserUpdated } from "@mui/icons-material"

import { useState, useEffect } from "react"

export default function GetAllAvailableResults({onClose}){

    const [env, setEnv] = useState(null)
    const [version, setVersion] = useState('v2')
    const [divideTime, setDivideTime] = useState(0.05)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        window.env.get().then(setEnv)
      }, [])
    
    const handleGetAllAvailableResults = async (e) => {
        if (env.BACKEND_SERVER_DOMAIN && env.BACKEND_SERVER_PORT && env.API_GET_RECORD_SCHEDULE) {
            const apiLink = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_ALL_AVAILABLE_RESULTS_EXCEL}`;
            const data = {version: version, divide_time: divideTime}
            setProgress(0);
            const res = await fetch(apiLink, {
                method: "POST",
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(data)
            })
            if (!res.ok){
                const err = await res.json().catch(() => null)
                console.error("Download failed", res.status, err);
                return;
            }
            const blob = await res.blob()
            const cd = res.headers.get("Content-Dsiposition") || '';
            const filenameMatch = cd.match(/filename="?([^";]+)"?/)
            const filename = filenameMatch ? filenameMatch[1] : `results_${version}_${divideTime}.xlsx`
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a")
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
    }
    useEffect(() => {
            if (!env) return;
            const wsUrl = `ws://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/ws/downloading_results_progress/`;
            const ws = new window.WebSocket(wsUrl);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Progress update:", data.progress);
                if (Math.abs(data.progress - 100) < 1 ){
                }
                if (data.progress !== undefined) setProgress(data.progress);
            };
            ws.onclose = () => { /* Optionally handle close */ };
            ws.onerror = (e) => { /* Optionally handle error */ };
    
            return () => ws.close();
        }, [env]);
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[400px] bg-main-500 shadow-2xl p-10 rounded-lg flex flex-col gap-5 max-h-[80vh] overflow-auto">
            <Typography className="!text-xl !font-bold text-white">
                Download All Available Results
            </Typography>
            <div className="flex flex-row justify-between items-center">
                <FormControl>
                    <InputLabel id="protocol-select-label">
                        <Typography className="text-white">Version</Typography>
                    </InputLabel>
                    <Select
                        labelId="protocol-select-label"
                        id="select-protocol"
                        color="primary.white"
                        className="shadow-lg !py-0 w-32 bg-main-400"
                        value={version}
                        sx={{
                        color: 'primary.white'
                        }}
                        onChange={(e) => setVersion(e.target.value)}
                    >
                        <MenuItem value="v1">V1</MenuItem>
                        <MenuItem value="v2">V2</MenuItem>
                    </Select>
                    
                </FormControl>
                <TextField
                    id="outlined-number"
                    type="number"
                    className="bg-main-400 w-1/3 rounded-md"
                    slotProps={{
                        inputLabel: {
                            shrink: true
                        },
                        htmlInput: {
                            step: "0.01",
                            min: "0"
                        }
                    }}
                    value={divideTime}
                    onChange={(e) => {
                        const value = e.target.value
                        if (value >= 0) {
                            setDivideTime(value)
                        } else {
                            openNotification('error', 'Frame must be a positive number.')
                        }
                    }}
                    label={<Typography className="text-white">Frame</Typography>}
                />
                
            </div>
            {progress > 0 && progress < 100 && (
                <div className="flex w-full">
                    <LinearProgress variant="determinate" value={progress*100} className="w-full h-full"/>
                </div>
            )}
            <div className="flex flex-row justify-between items-center">
                <Button component="label"
                    role={undefined}
                    tabIndex={-1}
                    variant="contained"
                    className="!bg-main-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                    onClick ={(e) => handleGetAllAvailableResults(e)}>
                    <BrowserUpdated />
                </Button>
                <Button
                    component="label"
                    role={undefined}
                    tabIndex={-1}
                    variant="contained"
                    className="!bg-main-400 rounded-lg shadow-xl !p-2.5 !w-10 active:shadow-none active:bg-main-700"
                    onClick={() => {onClose()}}
                >
                    <Close/>
                    
                </Button>
                
            </div>
        </div>
    )
}