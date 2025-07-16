import { Box, LinearProgress, Typography } from '@mui/material';
import "../assets/main.css"
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" className="text-white" >
          {`${Math.round(props.value)}%`}
        </Typography>
        <Typography variant="body2" className="text-white" >
          {props.recording ? <Typography variant="caption">Recording</Typography> : null}
          {props.converting ? <Typography variant="caption">Converting</Typography> : null}
        </Typography>
      </Box>
    </Box>
  );
}

export default LinearProgressWithLabel;