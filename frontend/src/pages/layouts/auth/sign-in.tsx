import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Grid,
  Paper,
  Alert,
  Button,
  Checkbox,
  Snackbar,
  Container,
  TextField,
  IconButton,
  InputLabel,
  Typography,
  FormControl,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import LoginService from '../../../Services/api-services/Auth-Api-Services/LoginService';
import { MOBILE_LENGTH, MAX_EMAIL_LENGTH } from '../Constant';

interface UserCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

interface StatusMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  field?: string;
}

export default function Page() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCredentials>({
    identifier: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // New state for status messages
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value,
    });
    validateField(name, name === 'rememberMe' ? checked : value);
  };

  const validateField = (name: string, value: any): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    switch (name) {
      case 'identifier':
        if (!value) {
          newErrors.identifier = 'Email or Mobile is required';
          isValid = false;
        } else if (/\S+@\S+\.\S+/.test(value) && value.length > MAX_EMAIL_LENGTH) {
          newErrors.identifier = 'Please enter a valid email address';
          isValid = false;
        } else if (/^\d+$/.test(value) && value.length !== MOBILE_LENGTH) {
          newErrors.identifier = 'Please enter a valid 10-digit mobile number';
          isValid = false;
        } else {
          delete newErrors.identifier;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
          isValid = false;
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return isValid;
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate = ['identifier', 'password'];

    fieldsToValidate.forEach((field) => {
      const value =
        field === 'rememberMe' ? formData.rememberMe : formData[field as keyof UserCredentials];
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }

    try {
      const loginUserDto = {
        email: /\S+@\S+\.\S+/.test(formData.identifier) ? formData.identifier : undefined,
        mobile: /^\d+$/.test(formData.identifier) ? formData.identifier : undefined,
        password: formData.password,
      };

      const response = await LoginService.login(loginUserDto);
      console.log('Login successful:', response);
      setStatusMessage({
        text: response.message || 'Login successful',
        type: 'success',
      });
      setShowSnackbar(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      console.error('Login failed:', error);
      setStatusMessage({
        text: error.message || 'Invalid credentials. Please try again.',
        type: 'error',
      });
      setShowSnackbar(true);
      setErrors({ ...errors, password: error.message || 'Invalid credentials. Please try again.' });
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
          RiskdefenderAI.com
        </Typography>
        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
          Hi, Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter your credentials to continue
        </Typography>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={statusMessage?.type || 'info'}
            sx={{ width: '100%' }}
          >
            {statusMessage?.text}
          </Alert>
        </Snackbar>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                fullWidth
                id="identifier"
                label="Enter Email or Mobile"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                error={!!errors.identifier}
                helperText={errors.identifier}
              />
              {statusMessage?.field === 'identifier' && (
                <FormHelperText
                  sx={{
                    color: statusMessage.type === 'error' ? 'error.main' : 'success.main',
                    ml: 1,
                  }}
                >
                  {statusMessage.text}
                </FormHelperText>
              )}
            </Grid>

            {/* Password field */}
            <Grid item xs={12}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel htmlFor="password">Password</InputLabel>
                <OutlinedInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  error={!!errors.password}
                />
                <FormHelperText error={!!errors.password}>{errors.password}</FormHelperText>
              </FormControl>
              <Link to="/forget-password">Forgot Password?</Link>
            </Grid>

            {/* Remember me checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    name="rememberMe"
                    color="primary"
                  />
                }
                label="Remember me"
              />
            </Grid>

            {/* Submit button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
            </Grid>

            {/* Sign up link */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don&apos;t have an account? <Link to="/sign-up">Sign Up</Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
