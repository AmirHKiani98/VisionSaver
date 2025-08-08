import React from 'react';
import { Slider } from '@mui/material';

const VideoSlider = ({
  value,
  min = 0,
  max = 100,
  onChange,
  className = '',
  step = 0.1,
  sx = {},
  ...rest
}) => (
  <Slider
    value={value}
    min={min}
    max={max}
    onChange={onChange}
    className={className}
    step={step}
    sx={sx}
    {...rest}
  />
);

export default VideoSlider;