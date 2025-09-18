import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Line, Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import {
    Button
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
                const labels = responseData.labels || 
                    (responseData.datasets[0]?.data.map((_, i) => i.toString()) || []);
                
                // Convert data format for scatter plot
                const scatterDatasets = responseData.datasets.map(dataset => {
                    return {
                        ...dataset,
                        // Convert array data to scatter format with x,y coordinates
                        data: dataset.data.map((y, index) => ({
                            x: parseInt(labels[index]),  // Use the label as x-value (time)
                            y: y                         // Use the count as y-value
                        }))
                    };
                });
                
                setData({
                    datasets: scatterDatasets
                });
                console.log("Scatter data loaded:", { datasets: scatterDatasets });
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
        <div className="p-5 flex flex-col h-screen">
            <Button
                className="max-w-10 mb-4"
                variant="contained"
                color="primary"
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
                    <div className="flex justify-center h-full">
                        <Scatter
                            ref={ref}
                            datasetIdKey='id'
                            data={data}
                            options={config.options}
                            height={400}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}