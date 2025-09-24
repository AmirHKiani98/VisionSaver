import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import {
    Button, Chip, Slider, Typography, Box
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
    const [maxTime, setMaxTime] = React.useState(1200); // Default to reasonable value
    const [minMaxTime, setMinMaxTime] = React.useState([0, 1200]);
    const [fullData, setFullData] = React.useState(null); // Store complete dataset
    const [frameImage, setFrameImage] = React.useState(null);
    const [frameTime, setFrameTime] = React.useState(null);
    const [loadingFrame, setLoadingFrame] = React.useState(false);
    const [data, setData] = React.useState({
        datasets: [
            {
                id: 1,
                label: 'Loading...',
                data: [{x: 0, y: 0}],
            },
        ],
    });
    const [loadingData, setLoadingData] = React.useState(true);

    // Update minMaxTime when maxTime changes
    useEffect(() => {
        if (maxTime > 0) {
            setMinMaxTime([0, Math.ceil(maxTime)]);
        }
    }, [maxTime]);

    // Initialize environment
    useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    // Update chart options when time range changes
    useEffect(() => {
        if (!fullData) return;
        
        // Create a copy of the config
        const newOptions = { ...config.options };
        
        // Update x-axis limits
        newOptions.scales.x.min = minMaxTime[0];
        newOptions.scales.x.max = minMaxTime[1];
        
        // Update the chart
        if (ref.current) {
            ref.current.options = newOptions;
            ref.current.update();
        }
        
    }, [minMaxTime]);

    useEffect(() => {
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
                // Add colors to datasets for better visualization
                const colors = ['rgba(75,192,192,1)', 'rgba(255,99,132,1)', 
                                'rgba(54,162,235,1)', 'rgba(255,206,86,1)'];
                // Add vertical highlight areas for false_positives and missed_detections
                const areaDatasets = [];

                const addAreaDatasets = (points, color, label) => {
                    if (!Array.isArray(points)) return;
                    points.forEach((point, idx) => {
                        areaDatasets.push({
                            type: 'line',
                            label: `${label} ${idx + 1}`,
                            data: [
                                { x: point.x - 3, y: 0 },
                                
                                { x: point.x + 3, y: 0 },
                               
                                { x: point.x - 3, y: 5 },
                                { x: point.x + 3, y: 5 },
                                
                            ],
                            borderColor: color,
                            borderWidth: 0,
                            backgroundColor: color,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            order: 0,
                            showLine: true,
                            stepped: false,
                            segment: {
                                borderDash: [2, 2]
                            }
                        });
                        
                    });
                };

                addAreaDatasets(responseData.missed_detections, 'rgba(54, 162, 235, 0.4)', 'Missed Detection');
                addAreaDatasets(responseData.false_positives, 'rgba(255, 99, 132, 0.4)', 'False Positive');
                
                const enhancedDatasets = responseData.datasets.map((dataset, i) => ({
                    ...dataset,
                    backgroundColor: colors[i % colors.length],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderColor: colors[i % colors.length]
                }));
                
                // Combine the enhanced datasets with the area datasets
                const allDatasets = [...enhancedDatasets, ...areaDatasets];
                
                // Store complete dataset for reference
                setFullData({
                    datasets: allDatasets
                });
                
                // Set active dataset
                setData({
                    datasets: allDatasets
                });

                // Set total counts if available
                if (responseData.total_counts) {
                    setTotalCounts(responseData.total_counts);
                }
                
                // Find max time from the data
                let maxT = 0;
                enhancedDatasets.forEach(ds => {
                    ds.data.forEach(point => {
                        if (point.x > maxT) maxT = point.x;
                    });
                });
                
                // Use either provided max_time or calculated max
                const finalMaxTime = Math.max(
                    responseData.max_time || 0, 
                    maxT || 0, 
                    1200
                );
                
                setMaxTime(Math.ceil(finalMaxTime));

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
            onClick: (e, elements, chart) => {
                var timeOfInterest = 0;
                var noOfElements = 0;
                for (const element of elements) {
                    
                    const datasetIndex = element.datasetIndex;
                    const index = element.index;
                    const dataset = chart.data.datasets[datasetIndex];
                    const point = dataset.data[index];
                    timeOfInterest += point.x;
                    noOfElements += 1;
                }
                const avgTime = noOfElements > 0 ? (timeOfInterest / noOfElements) : 0;
                if (avgTime > 0 && env) {
                    setFrameTime(avgTime);
                    setFrameImage(null); // Clear previous image
                    setLoadingFrame(true);
                    const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_FRAME_AT_TIME}`;
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            record_id: recordId,
                            divide_time: divideTime,
                            version: version,
                            time: avgTime
                        })
                    })
                    .then(response => response.json())
                    .then(responseData => {
                        if (responseData.frame) {
                            // Open a new window to display the image
                            setFrameImage(`data:image/jpeg;base64,${responseData.frame}`);
                            setLoadingFrame(false);
                        } else if (responseData.error) {
                            alert(`Error: ${responseData.error}`);
                        } else {
                            alert('Unexpected response from server.');
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching frame at time:', error);
                        alert('Error fetching frame at selected time.');
                    });
                }
            },
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} at time ${context.parsed.x.toFixed(1)}s`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
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
                    },
                    min: minMaxTime[0],
                    max: minMaxTime[1]
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
                        color: 'black',
                        stepSize: 1
                    },
                    beginAtZero: true,
                    suggestedMax: 2 // Give space above the points
                }
            },
            elements: {
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            }
        }
    };

    return (
        <div className="p-5 flex flex-col h-screen gap-5 overflow-auto">
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
                            {frameImage && (
                                
                                <div className="mt-2 absolute top-5 right-5 bg-white p-1 border border-gray-300 rounded">
                                    <img width={300} height={300} src={frameImage} alt={`Frame`} />
                                </div>
                            )}
                            {loadingFrame && (
                                <div className="mt-2 absolute top-5 right-5 bg-white p-2 border border-gray-300 rounded flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                                    <Typography variant="body1" color="textSecondary">
                                        Loading frame...
                                    </Typography>
                                </div>
                            )}
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
                        <Box sx={{ mt: 2, mx: 2 }}>
                            
                            <Slider
                                className="mt-2"
                                aria-label="Time Range"
                                value={minMaxTime}
                                onChange={(event, newValue) => setMinMaxTime(newValue)}
                                valueLabelDisplay="auto"
                                valueLabelFormat={value => `${value}s`}
                                min={0}
                                max={Math.ceil(maxTime)}
                                step={1}
                            />
                            <div className="flex justify-between text-xs">
                                <span>0s</span>
                                <span>{Math.ceil(maxTime)}s</span>
                            </div>
                        </Box>
                    </div>
                )}
            </div>
        </div>
    );
}