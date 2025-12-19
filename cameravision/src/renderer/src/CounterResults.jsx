import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
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
    const [totalTime, setTotalTime] = React.useState(0)
    const [maxTime, setMaxTime] = React.useState(1200); // Default to reasonable value
    const [minTime, setMinTime] = React.useState(0)
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
    const COLOR_AUTO = 'rgba(75,192,192,0.8)';      // Teal
    const COLOR_MANUAL = 'rgba(255,99,132,0.8)';    // Red
    const COLOR_ISS = 'rgba(75,192,75,0.9)';        // Green
    const [loadingData, setLoadingData] = React.useState(true);

    // Update minMaxTime when maxTime changes
    const downloadAutoISSExcels = () => {
        if (!env) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_DOWNLOAD_AUTO_ISS_EXCELS}`;
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
        .then(async response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Server error response:", text);
                    throw new Error(`Server returned ${response.status}: ${text}`);
                });
            }
            return response.blob();
        })
        .then(blob => {
            // Create a link to download the file
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `counter_auto_iss_results_record_${recordId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        })
        .catch(error => {
            console.error('Error downloading excels:', error);
        });
    }
    // Initialize environment
    useEffect(() => {
        window.env.get().then(setEnv);
    }, []);

    useEffect(() => {
        if (!env) return;
        const url = `http://${env.BACKEND_SERVER_DOMAIN}:${env.BACKEND_SERVER_PORT}/${env.API_GET_DURATION_TIME}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_id: recordId,
            })
        }).then(async response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Server error response:", text);
                    throw new Error(`Server returned ${response.status}: ${text}`);
                });
            }
            return response.json();
        }).then(responseData => {
            if(responseData)                
            setTotalTime(responseData.duration)
            setMaxTime(Math.min(responseData.duration, 1000))
        }).catch(error => {
            console.error('Error fetching duration time:', error);
        })
    }, [env])

    // Update chart options when time range changes
    useEffect(() => {
        if (!fullData) return;
        
        // Create a copy of the config
        const newOptions = { ...config.options };
        
        // Update x-axis limits
        newOptions.scales.x.min = minTime;
        newOptions.scales.x.max = maxTime;
        
        // Update the chart
        if (ref.current) {
            ref.current.options = newOptions;
            ref.current.update();
        }
        
    }, [minTime, maxTime]);

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
                divide_time: divideTime,
                min_time: minTime,
                max_time: maxTime
            })
        })
        .then(async response => {
            // First check if response is ok
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Server error response:", text);
                    throw new Error(`Server returned ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
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
                            label: `${label}`,
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
                
                // Define colors for each type
                

                const enhancedDatasets = responseData.datasets.map((dataset) => {
                    let color = COLOR_AUTO; // Default to Auto
                    if (dataset.label && dataset.label.toLowerCase().includes('manual')) {
                        color = COLOR_MANUAL;
                    } else if (dataset.label && dataset.label.toLowerCase().includes('iss')) {
                        color = COLOR_ISS;
                    }
                    return {
                        ...dataset,
                        backgroundColor: color,
                        borderColor: color,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    };
                });
                
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
                        },
                        generateLabels: (chart) => {
                            // Only one legend for Missed Detection (blue) and one for False Positive (red)
                            const labels = [];
                            // Find first Missed Detection area dataset
                            const missed = chart.data.datasets.find(ds => ds.label === 'Missed Detection');
                            if (missed) {
                                const missedCount = chart.data.datasets
                                    .filter(ds => ds.label === 'Missed Detection')
                                    .reduce((count, ds) => count + (ds.data.length / 4), 0);
                                labels.push({
                                    text: `Missed Detection (${Math.round(missedCount)})`,
                                    fillStyle: missed.backgroundColor || 'rgba(54, 162, 235, 0.4)',
                                    strokeStyle: missed.borderColor || 'rgba(54, 162, 235, 1)',
                                    hidden: missed.hidden,
                                    datasetIndex: chart.data.datasets.indexOf(missed)
                                });
                            }
                            // Find first False Positive area dataset
                            const falsePos = chart.data.datasets.find(ds => ds.label === 'False Positive');
                            if (falsePos) {
                                const falsePosCount = chart.data.datasets
                                    .filter(ds => ds.label === 'False Positive')
                                    .reduce((count, ds) => count + (ds.data.length / 4), 0);
                                labels.push({
                                    text: `False Positive (${Math.round(falsePosCount)})`,
                                    fillStyle: falsePos.backgroundColor || 'rgba(255, 99, 132, 0.4)',
                                    strokeStyle: falsePos.borderColor || 'rgba(255, 99, 132, 1)',
                                    hidden: falsePos.hidden,
                                    datasetIndex: chart.data.datasets.indexOf(falsePos)
                                });
                            }
                            return labels;
                        }
                    },
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
                            const point = context.raw; // This is the data object for the point
                            let label = `${context.dataset.label}: ${context.parsed.y} at time ${context.parsed.x.toFixed(1)}s`;
                            if (point.veh_ids && Array.isArray(point.veh_ids)) {
                                label += ` | Vehicle IDs: [${point.veh_ids.join(', ')}] | Label: ${point.label.join(', ')}`;
                            }
                            return label;
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
                    min: minTime,
                    max: maxTime
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
            <div classname="flex items-center justify-between">
                <Button
                    className="max-w-10"
                    onClick={() => window.history.back()}
                >
                    Back
                </Button>
                <Button onClick={downloadAutoISSExcels}>
                    <DownloadIcon />
                </Button>
            </div>
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
                        
                        <div className="min-h-10 w-full flex flex-col justify-center items-center gap-4">
                            {totalCounts && Object.keys(totalCounts).length > 0 ? (
                                Object.entries(
                                    Object.entries(totalCounts).reduce((acc, [key, value]) => {
                                        const groupKey = key.split(' ')[0]; // Get prefix like 'Auto', 'Manual', 'ISS'
                                        if (!acc[groupKey]) acc[groupKey] = [];
                                        acc[groupKey].push([key, value]);
                                        return acc;
                                    }, {})
                                ).map(([group, items]) => (
                                    <div key={group} className="flex flex-wrap justify-center items-center gap-2 w-full">
                                        {items
                                            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by key alphabetically
                                            .map(([key, value], index) => {
                                                let chipStyle = {};
                                                const lowerKey = key.toLowerCase();
                                                if (lowerKey.includes('auto')) {
                                                    chipStyle = { backgroundColor: COLOR_AUTO };
                                                } else if (lowerKey.includes('manual')) {
                                                    chipStyle = { backgroundColor: COLOR_MANUAL };
                                                } else if (lowerKey.includes('iss')) {
                                                    chipStyle = { backgroundColor: COLOR_ISS };
                                                }
                                                return (
                                                    <Chip
                                                        key={`${group}-${index}`}
                                                        label={`${key}: ${value}`}
                                                        className="m-1"
                                                        style={chipStyle}
                                                    />
                                                );
                                            })}
                                    </div>
                                ))
                            ) : (
                                <Chip label="No counts available" className="m-1" />
                            )}
                        </div>

                        <Box sx={{ mt: 2, mx: 2 }}>
                            <Slider
                                className="mt-2"
                                aria-label="Time Range"
                                value={[minTime, maxTime]}
                                onChange={(event, newValue) => {
                                    setMinTime(newValue[0]);
                                    setMaxTime(newValue[1]);
                                }}
                                valueLabelDisplay="auto"
                                valueLabelFormat={value => `${value}s`}
                                min={0}
                                max={Math.ceil(totalTime)}
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