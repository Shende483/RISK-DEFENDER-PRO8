
import { Box, Typography } from '@mui/material';
import CardWrapper from '../../../../../../../components/common-cards/card-wrapper';

export default function AlertingDetails() {
  return (
     <CardWrapper sx={{ height: '400px', width: '100%' }}>
      <Box sx={{ p: 10, height: '100%' }}>
        <Typography>MyDefinedRules</Typography>
      </Box>
    </CardWrapper>
  );
}
