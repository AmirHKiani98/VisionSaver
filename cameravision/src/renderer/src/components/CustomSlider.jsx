import react from 'react';


function CustomSlider({ value, onChange, min = 0, max = 100, step = 1, className = '', sx, ...props }) {
    return (
        <Slider
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleSliderChange}
            step={0.1}
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '-0px',
                width: '100%',
                height: '8px',
                padding: 0,
                backgroundColor: 'rgba(250, 250, 250, 1)', // rgba for #122846
                
                '& .MuiSlider-rail': {
                    background: `linear-gradient(to right, #ff0000 70%, #0000ff 70%)`
                },
            }}
        />
    );
}