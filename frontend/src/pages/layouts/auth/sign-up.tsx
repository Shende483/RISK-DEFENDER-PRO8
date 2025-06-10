import type { SelectChangeEvent } from '@mui/material';

import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Grid,
  Paper,
  Alert,
  Button,
  Select,
  Checkbox,
  MenuItem,
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

import { CONFIG } from '../../../config-global';
import AuthService from '../../../Services/api-services/Auth-Api-Services/RegisterService';
import { COUNTRIES, OTP_LENGTH, MOBILE_LENGTH, MAX_EMAIL_LENGTH } from '../Constant';

interface UserCredentials {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  emailOtp: string;
  mobileOtp: string;
  country: string;
  countryCode: string;
  agreeTnC: boolean;
}

interface StatusMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  field?: string;
}

export default function Page() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCredentials>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    emailOtp: '',
    mobileOtp: '',
    country: 'in',
    countryCode: '+91',
    agreeTnC: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [mobileSent, setMobileSent] = useState<boolean>(false);
  const [mobileVerified, setMobileVerified] = useState<boolean>(false);
  const [emailTimer, setEmailTimer] = useState<number>(0);
  const [mobileTimer, setMobileTimer] = useState<number>(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState<boolean>(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState<boolean>(false);
  const [emailVerifying, setEmailVerifying] = useState<boolean>(false);
  const [mobileVerifying, setMobileVerifying] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'agreeTnC' ? checked : value,
    }));
    validateField(name, name === 'agreeTnC' ? checked : value);
  };

  const handleCountryChange = (event: SelectChangeEvent<string>) => {
    const countryValue = event.target.value as string;
    const selectedCountry = COUNTRIES.find((country) => country.value === countryValue);
    setFormData((prevData) => ({
      ...prevData,
      country: countryValue,
      countryCode: selectedCountry?.code || '+91',
    }));
  };

  const validateField = (name: string, value: any): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!value || value.trim() === '') {
          newErrors.firstName = 'First name is required';
          isValid = false;
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value || value.trim() === '') {
          newErrors.lastName = 'Last name is required';
          isValid = false;
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(value) || value.length > MAX_EMAIL_LENGTH) {
          newErrors.email = 'Please enter a valid email address';
          isValid = false;
        } else {
          delete newErrors.email;
        }
        break;

      case 'mobile':
        if (!value) {
          newErrors.mobile = 'Mobile number is required';
          isValid = false;
        } else if (!/^\d+$/.test(value) || value.length !== MOBILE_LENGTH) {
          newErrors.mobile = 'Please enter a valid 10-digit mobile number';
          isValid = false;
        } else {
          delete newErrors.mobile;
        }
        break;

      case 'emailOtp':
        if (!value) {
          newErrors.emailOtp = 'Email OTP is required';
          isValid = false;
        } else if (!/^\d+$/.test(value) || value.length !== OTP_LENGTH) {
          newErrors.emailOtp = 'Please enter a valid 6-digit OTP';
          isValid = false;
        } else {
          delete newErrors.emailOtp;
        }
        break;

      case 'mobileOtp':
        if (!value) {
          newErrors.mobileOtp = 'Mobile OTP is required';
          isValid = false;
        } else if (!/^\d+$/.test(value) || value.length !== OTP_LENGTH) {
          newErrors.mobileOtp = 'Please enter a valid 6-digit OTP';
          isValid = false;
        } else {
          delete newErrors.mobileOtp;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
          isValid = false;
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
          isValid = false;
        } else {
          delete newErrors.password;
        }
        break;

      case 'agreeTnC':
        if (!value) {
          newErrors.agreeTnC = 'You must agree to Terms & Conditions';
          isValid = false;
        } else {
          delete newErrors.agreeTnC;
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
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'mobile', 'password', 'agreeTnC'];

    fieldsToValidate.forEach((field) => {
      const value =
        field === 'agreeTnC' ? formData.agreeTnC : formData[field as keyof UserCredentials];
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    // Check if both email and mobile are verified
    if (!emailVerified || !mobileVerified) {
      showMessage('Please verify both email and mobile before submitting', 'warning');
      isValid = false;
    }

    return isValid;
  };

  const startTimer = (type: 'email' | 'mobile') => {
    const timerDuration = 300; // 5 minutes

    const setTimerFunction = type === 'email' ? setEmailTimer : setMobileTimer;

    setTimerFunction(timerDuration);
    const interval = setInterval(() => {
      setTimerFunction((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const showMessage = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    field?: string
  ) => {
    setStatusMessage({ text: message, type, field });
    setShowSnackbar(true);

    // updates field error if it's an error message
    if (type === 'error' && field) {
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSendEmailOTP = async () => {
    if (validateField('email', formData.email)) {
      try {
        setEmailOtpLoading(true);
        setEmailSent(false); // Reset email sent state

        const response = await AuthService.sendOtpEmail(formData.email);

        setEmailSent(true);
        startTimer('email');
        showMessage(response.message || `OTP sent to email: ${formData.email}`, 'success', 'email');

        // Clear any previous errors
        setErrors((prev) => ({ ...prev, email: '' }));
      } catch (error: any) {
        console.error('Error sending email OTP:', error);
        showMessage(error.message || 'Failed to send OTP. Please try again.', 'error', 'email');
        setEmailSent(false);
      } finally {
        setEmailOtpLoading(false);
      }
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (validateField('emailOtp', formData.emailOtp)) {
      try {
        setEmailVerifying(true);
        const response = await AuthService.verifyOtpEmail(formData.email, formData.emailOtp);
        setEmailVerified(true);
        showMessage(response.message || 'Email OTP verified successfully', 'success', 'emailOtp');

        // Reset OTP field on successful verification
        setFormData((prev) => ({ ...prev, emailOtp: '' }));
      } catch (error: any) {
        console.error('Error verifying email OTP:', error);
        showMessage(error.message || 'Invalid OTP. Please try again.', 'error', 'emailOtp');
      } finally {
        setEmailVerifying(false);
      }
    }
  };

  const handleSendMobileOTP = async () => {
    if (validateField('mobile', formData.mobile)) {
      try {
        setMobileOtpLoading(true);
        setMobileSent(false); // Reset mobile sent state

        const response = await AuthService.sendOtpMobile(formData.mobile);

        setMobileSent(true);
        startTimer('mobile');
        showMessage(
          response.message || `OTP sent to mobile: ${formData.mobile}`,
          'success',
          'mobile'
        );

        // Clear any previous errors
        setErrors((prev) => ({ ...prev, mobile: '' }));
      } catch (error: any) {
        console.error('Error sending mobile OTP:', error);
        showMessage(error.message || 'Failed to send OTP. Please try again.', 'error', 'mobile');
        setMobileSent(false);
      } finally {
        setMobileOtpLoading(false);
      }
    }
  };

  const handleVerifyMobileOTP = async () => {
    if (validateField('mobileOtp', formData.mobileOtp)) {
      try {
        setMobileVerifying(true);
        const response = await AuthService.verifyOtpMobile(formData.mobile, formData.mobileOtp);
        setMobileVerified(true);
        showMessage(response.message || 'Mobile OTP verified successfully', 'success', 'mobileOtp');

        // Reset OTP field on successful verification
        setFormData((prev) => ({ ...prev, mobileOtp: '' }));
      } catch (error: any) {
        console.error('Error verifying mobile OTP:', error);
        showMessage(error.message || 'Invalid OTP. Please try again.', 'error', 'mobileOtp');
      } finally {
        setMobileVerifying(false);
      }
    }
  };

  const resetEmailVerification = useCallback(() => {
    if (emailTimer === 0 && !emailVerified) {
      setEmailSent(false);
      setFormData((prev) => ({ ...prev, emailOtp: '' }));
    }
  }, [emailTimer, emailVerified, setEmailSent, setFormData]);

  const resetMobileVerification = useCallback(() => {
    if (mobileTimer === 0 && !mobileVerified) {
      setMobileSent(false);
      setFormData((prev) => ({ ...prev, mobileOtp: '' }));
    }
  }, [mobileTimer, mobileVerified, setMobileSent, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const createUserDto = {
          name: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          countryCode: formData.countryCode,
        };

        const response = await AuthService.register(createUserDto);
        showMessage(response.message || 'Registration successful', 'success');

        // Navigate to sign-in page after successful registration
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
      } catch (error: any) {
        console.error('Error registering user:', error);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  // Automatically reset verification forms when timer expires
  useEffect(() => {
    if (emailTimer === 0) {
      resetEmailVerification();
    }
  }, [emailTimer, resetEmailVerification]); // Include resetEmailVerification

  useEffect(() => {
    if (mobileTimer === 0) {
      resetMobileVerification();
    }
  }, [mobileTimer, resetMobileVerification]); // Include resetMobileVerification

  return (
    <>
      <Helmet>
        <title>{`Sign up - ${CONFIG.appName}`}</title>
      </Helmet>

      <Container component="main" maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 8,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
            RiskdefenderAI.com
          </Typography>

          <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
            Sign up
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
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={{ bgcolor: '#f9f9f9', borderRadius: 1 }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={{ bgcolor: '#f9f9f9', borderRadius: 1 }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={9}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="email"
                  label="Enter Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={emailVerified}
                  sx={{
                    bgcolor: emailVerified ? '#e0f7fa' : '#fffde7',
                    borderRadius: 1,
                    '& input': {
                      textAlign: 'center',
                      letterSpacing: '1px',
                    },
                  }}
                  inputProps={{
                    maxLength: MAX_EMAIL_LENGTH,
                    placeholder: 'example@gmail.com',
                  }}
                />
              </Grid>

              {/* Send Email OTP Button */}
              <Grid item xs={3}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleSendEmailOTP}
                  disabled={emailVerified || emailTimer > 0 || !formData.email || emailOtpLoading}
                  sx={{ height: '56px' }}
                >
                  {emailOtpLoading ? (
                    <CircularProgress size={24} />
                  ) : emailTimer > 0 ? (
                    `${Math.floor(emailTimer / 60)}:${(emailTimer % 60).toString().padStart(2, '0')}`
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </Grid>

              {/* Email OTP - Only show when needed and hide after verification */}
              {emailSent && !emailVerified && (
                <>
                  <Grid item xs={9}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      id="emailOtp"
                      label="Enter Email OTP"
                      name="emailOtp"
                      value={formData.emailOtp}
                      onChange={handleChange}
                      error={!!errors.emailOtp}
                      helperText={errors.emailOtp}
                      sx={{
                        bgcolor: '#f9f9f9',
                        borderRadius: 1,
                        '& input': {
                          textAlign: 'center',
                          letterSpacing: '9px',
                        },
                      }}
                      inputProps={{
                        maxLength: OTP_LENGTH,
                        placeholder: '_ _ _ _ _ _',
                      }}
                    />
                  </Grid>

                  {/* Verify Email OTP Button */}
                  <Grid item xs={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={handleVerifyEmailOTP}
                      disabled={!emailSent || !formData.emailOtp || emailVerifying}
                      sx={{ height: '56px' }}
                    >
                      {emailVerifying ? <CircularProgress size={24} /> : 'Verify OTP'}
                    </Button>
                  </Grid>
                </>
              )}

              {/* Country Select */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Country</InputLabel>
                  <Select
                    value={formData.country}
                    onChange={handleCountryChange}
                    input={<OutlinedInput label="Select Country" />}
                    sx={{ bgcolor: '#f9f9f9', borderRadius: 1 }}
                  >
                    {COUNTRIES.map((country) => (
                      <MenuItem key={country.value} value={country.value}>
                        {country.flag} {country.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Mobile Number */}
              <Grid item xs={9}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="mobile"
                  label="Enter Mobile Number"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleChange}
                  error={!!errors.mobile}
                  helperText={errors.mobile}
                  disabled={mobileVerified}
                  sx={{
                    bgcolor: mobileVerified ? '#e0f7fa' : '#f9f9f9',
                    borderRadius: 1,
                    '& input': {
                      textAlign: 'center',
                      letterSpacing: '7px',
                    },
                  }}
                  inputProps={{
                    maxLength: MOBILE_LENGTH,
                    pattern: '\\d*',
                    placeholder: '9556xxx567',
                  }}
                />
              </Grid>

              {/* Send Mobile OTP Button */}
              <Grid item xs={3}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleSendMobileOTP}
                  disabled={
                    mobileVerified || mobileTimer > 0 || !formData.mobile || mobileOtpLoading
                  }
                  sx={{ height: '56px' }}
                >
                  {mobileOtpLoading ? (
                    <CircularProgress size={24} />
                  ) : mobileTimer > 0 ? (
                    `${Math.floor(mobileTimer / 60)}:${(mobileTimer % 60).toString().padStart(2, '0')}`
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </Grid>

              {/* Mobile OTP - Only show when needed and hide after verification */}
              {mobileSent && !mobileVerified && (
                <>
                  <Grid item xs={9}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      id="mobileOtp"
                      label="Enter Mobile OTP"
                      name="mobileOtp"
                      value={formData.mobileOtp}
                      onChange={handleChange}
                      error={!!errors.mobileOtp}
                      helperText={errors.mobileOtp}
                      sx={{
                        bgcolor: '#f9f9f9',
                        borderRadius: 1,
                        '& input': {
                          textAlign: 'center',
                          letterSpacing: '9px',
                        },
                      }}
                      inputProps={{
                        maxLength: OTP_LENGTH,
                        pattern: '\\d*',
                        placeholder: '_ _ _ _ _ _',
                      }}
                    />
                  </Grid>

                  {/* Verify Mobile OTP Button */}
                  <Grid item xs={3}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={handleVerifyMobileOTP}
                      disabled={!mobileSent || !formData.mobileOtp || mobileVerifying}
                      sx={{ height: '56px' }}
                    >
                      {mobileVerifying ? <CircularProgress size={24} /> : 'Verify OTP'}
                    </Button>
                  </Grid>
                </>
              )}

              {/* Verification Status */}
              <Grid item xs={12}>
                <Grid container spacing={1}>
                  {emailVerified && (
                    <Grid item>
                      <Alert severity="success" sx={{ py: 0 }}>
                        Email Verified
                      </Alert>
                    </Grid>
                  )}
                  {mobileVerified && (
                    <Grid item>
                      <Alert severity="success" sx={{ py: 0 }}>
                        Mobile Verified
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Password */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="password">Enter Password</InputLabel>
                  <OutlinedInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Enter Password"
                    sx={{
                      bgcolor: '#fffde7',
                      borderRadius: 1,
                      '& input': {
                        textAlign: 'center',
                        letterSpacing: '2px',
                      },
                    }}
                  />
                  {errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Terms & Conditions */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeTnC"
                      color="primary"
                      checked={formData.agreeTnC}
                      onChange={handleChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I Agree with{' '}
                      <Link to="#" style={{ textDecoration: 'none', fontWeight: 'bold' }}>
                        Terms & Conditions.
                      </Link>
                    </Typography>
                  }
                />
                {errors.agreeTnC && <FormHelperText error>{errors.agreeTnC}</FormHelperText>}
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{
                    mt: 1,
                    mb: 2,
                    height: '48px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    textTransform: 'none',
                  }}
                  disabled={!emailVerified || !mobileVerified}
                >
                  Sign Up
                </Button>
              </Grid>
            </Grid>

            {/* Sign In Link */}
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="primary">
                Already have an account?
                <Link
                  to="/sign-in"
                  style={{
                    textDecoration: 'none',
                    marginLeft: '5px',
                    color: '#3f51b5',
                    fontWeight: 'bold',
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
