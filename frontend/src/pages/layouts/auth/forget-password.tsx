import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Grid,
  Paper,
  Alert,
  Button,
  Checkbox,
  Snackbar,
  TextField,
  Container,
  Typography,
  IconButton,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import ForgetPasswordService from '../../../Services/api-services/Auth-Api-Services/ForgetPassService';

const ForgetPassword = (): JSX.Element => {
  const navigate = useNavigate();
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [timer, setTimer] = useState<number>(0);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const isEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const startTimer = () => {
    setTimer(300); // 5 minutes
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setOtpSent(false);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!emailOrMobile) return;

    try {
      setOtpLoading(true);
      let response;
      if (isEmail(emailOrMobile)) {
        response = await ForgetPasswordService.sendOtpEmail(emailOrMobile);
        showSnackbar(response?.message || 'OTP sent to your email', 'success');
      } else {
        response = await ForgetPasswordService.sendOtpMobile(emailOrMobile);
        showSnackbar(response?.message || 'OTP sent to your mobile', 'success');
      }
      setOtpSent(true);
      startTimer();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to send OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !otpSent) return;

    try {
      setVerifyLoading(true);
      let response;
      if (isEmail(emailOrMobile)) {
        response = await ForgetPasswordService.verifyOtpEmail(emailOrMobile, otp);
      } else {
        response = await ForgetPasswordService.verifyOtpMobile(emailOrMobile, otp);
      }
      setOtpVerified(true);
      setTimer(0);
      showSnackbar(response?.message || 'OTP verified successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to verify OTP', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !otpVerified) return;

    try {
      setLoading(true);
      const payload = isEmail(emailOrMobile)
        ? { email: emailOrMobile, password: newPassword, otp }
        : { mobile: emailOrMobile, password: newPassword, otp };

      const response = await ForgetPasswordService.resetPassword(payload);
      showSnackbar(response.message || 'Password reset successful', 'success');
      setTimeout(() => {
        navigate('/sign-in');
      }, 2000);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          sx={{ mb: 3, color: 'primary.main', fontWeight: 'medium' }}
        >
          Reset Password
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Enter your credentials to continue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={otpVerified ? 12 : 8}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="emailOrMobile"
                label="Email Address or Mobile Number"
                name="emailOrMobile"
                autoComplete="email"
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                placeholder="Enter your email or mobile number"
                disabled={otpSent && timer > 0}
                sx={{ mb: 2, bgcolor: 'rgba(255, 255, 200, 0.3)' }}
              />
            </Grid>

            {!otpVerified && (
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendOTP}
                  disabled={!emailOrMobile || otpLoading || (otpSent && timer > 0)}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  {otpLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : timer > 0 ? (
                    `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </Grid>
            )}
          </Grid>

          {otpSent && !otpVerified && (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="otp"
                  label="OTP"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to email/mobile"
                />
              </Grid>

              <Grid item xs={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVerifyOTP}
                  disabled={!otp || !otpSent || verifyLoading}
                  fullWidth
                  sx={{ height: '56px', mt: 2 }}
                >
                  {verifyLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                </Button>
              </Grid>
            </Grid>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="newPassword"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={!otpVerified}
            sx={{ mb: 2, bgcolor: 'rgba(255, 255, 200, 0.3)' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember me"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={!newPassword || !otpVerified || loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              bgcolor: 'purple',
              '&:hover': {
                bgcolor: 'darkpurple',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Remember your password? <Link to="/sign-in">Sign in</Link>
          </Typography>
          <Typography variant="body2" align="center" sx={{ mt: 1, color: 'primary.main' }}>
            Don&apos;t have an account? <Link to="/sign-up">Sign Up</Link>
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgetPassword;
