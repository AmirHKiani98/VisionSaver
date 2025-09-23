import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Line, Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import {
    Button, Chip
} from '@mui/material';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function CounterResults() {
    // getting record-id, version, divide-time-time
    const query = useQuery();
    const recordId = query.get('record-id');
    const version = query.get('version');
    const divideTime = query.get('divide-time');
    const ref = React.useRef();
    const [env, setEnv] = React.useState(null);
    const [totalCounts, setTotalCounts] = React.useState({})
    const [data, setData] = React.useState({
        labels: ['Loading...'],
        datasets: [
            {
                id: 1,
                label: 'Loading...',
                data: [0],
            },
        ],
    });
    const [loadingData, setLoadingData] = React.useState(true);

    React.useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    React.useEffect(() => {
        if (!env) return;
        setLoadingData(true);
        
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_COUNTER_MANUAL_AUTO_RESULTS}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_id: recordId,
                version: version,
                divide_time: divideTime
            })
        })
        .then(response => response.json())
        .then(responseData => {
            setLoadingData(false);

            if(responseData.datasets) {
                // Generate labels if they're missing
                
                
                setData({
                    datasets: responseData.datasets
                });

                setTotalCounts(responseData.total_counts);
                console.log(responseData.total_counts);

            } else {
                console.error("Invalid data format received:", responseData);
            }
        })
        .catch(error => {
            setLoadingData(false);
            console.error('Error fetching counter results:', error);
        });
    }, [env, recordId, version, divideTime]);

    const config = {
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'black',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Traffic Count Comparison',
                    color: 'black',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (seconds)',
                        color: 'black',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: 'black'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Vehicle Count',
                        color: 'black',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: 'black'
                    }
                }
            }
        }
    };

    return (
        <div className="p-5 flex flex-col h-screen gap-5">
            <Button
                className="max-w-10"
                onClick={() => window.history.back()}
            >
                Back
            </Button>
            <div className="flex-1 w-full shadow-xl bg-white/20 backdrop-blur-2xl rounded-lg p-5">
                {loadingData ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-lg font-bold">Loading data...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full flex-1">
                        <div className="flex flex-1 justify-center h-full">
                            <Scatter
                                ref={ref}
                                datasetIdKey='id'
                                data={data}
                                options={config.options}
                                height={400}
                            />
                        </div>
                        <div className="min-h-10 w-full flex justify-center items-center flex-wrap gap-2">
                            {totalCounts && Object.keys(totalCounts).length > 0 ? (
                                Object.entries(totalCounts).map(([key, value], index) => (
                                    <Chip key={index} label={`${key}: ${value}`} className="m-1" />
                                ))
                            ) : (
                                <Chip label="No counts available" className="m-1" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}