import { Box, LinearProgress, Typography } from '@mui/material';
import "../assets/main.css"
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }} className={`${props.className || ''}`}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          {...props}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#ccfbf1',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#0d9488',
              borderRadius: 4,
            },
            ...props.sx,
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }} className="flex items-center justify-between gap-1">
        <Typography variant="body2" className="!text-teal-700 !font-medium">
          {`${Math.round(props.value * (10 ** (props.roundNumber || 2))) / (10 ** (props.roundNumber || 2))}%`}
        </Typography>
        <Typography variant="caption" className="!text-slate-500">
          {props.recording ? 'Recording' : null}
          {props.converting ? 'Converting' : null}
        </Typography>
      </Box>
    </Box>
  );
}

export default LinearProgressWithLabel;