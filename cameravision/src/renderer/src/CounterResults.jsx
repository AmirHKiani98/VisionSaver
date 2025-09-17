import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
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
    const [env, setEnv] = React.useState(null)
    const [data, setData] = React.useState(
                        {
                            labels: ['Jun', 'Jul', 'Aug'],
                            datasets: [
                                {
                                    id: 1,
                                    label: 'Dataset 1',
                                    data: [5, 6, 7],
                                },
                                {
                                    id: 2,
                                    label: 'Dataset 2',
                                    data: [3, 2, 1],
                                },
                            ],
                        }
    )
    const [loadingData, setLoadingData] = React.useState(true);

    React.useEffect(() => {
        window.env.get().then(setEnv);
    }, [])

    React.useEffect(() => {
        if (!env) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_COUNTER_MANUAL_RESULTS}`;
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
            .then(data => {
                setData(data);
                // Process the data and update the chart
                if (ref.current) {
                    ref.current.update();
                }
            })
            .catch(error => {
                console.error('Error fetching counter results:', error);
            });
    }, []);
    const config = {
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: 'black',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X Axis',
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
                        text: 'Y Axis',
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
        <div className="p-5 flex flex-col">
            <Button
                className="max-w-10"
                onClick={() => window.history.back()}
            >Back</Button>
            <div className="flex-1 w-full shadow-xl bg-white/20 backdrop-blur-2xl rounded-lg p-5">
                <div className="flex justify-center">
                    <Line
                        ref={ref}
                        datasetIdKey='id'
                        data={data}
                        options={config.options}
                    />
                </div>
            </div>
        </div>
    );
}
