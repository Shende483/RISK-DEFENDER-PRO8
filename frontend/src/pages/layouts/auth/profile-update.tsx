import type { SelectChangeEvent } from '@mui/material';

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Grid,
  Paper,
  Button,
  Select,
  Checkbox,
  MenuItem,
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

import { getToken } from '../../../utils/getTokenFn';
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

export default function ProfileUpdate() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the token from local storage
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

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
  const [timer, setTimer] = useState<number>(0);

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
        if (value && value.trim() === '') {
          newErrors.firstName = 'First name is required';
          isValid = false;
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (value && value.trim() === '') {
          newErrors.lastName = 'Last name is required';
          isValid = false;
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'email':
        if (value && (!/\S+@\S+\.\S+/.test(value) || value.length > MAX_EMAIL_LENGTH)) {
          newErrors.email = 'Please enter a valid email address';
          isValid = false;
        } else {
          delete newErrors.email;
        }
        break;

      case 'mobile':
        if (value && (!/^\d+$/.test(value) || value.length !== MOBILE_LENGTH)) {
          newErrors.mobile = 'Please enter a valid 10-digit mobile number';
          isValid = false;
        } else {
          delete newErrors.mobile;
        }
        break;

      case 'password':
        if (value && value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
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

  const handleSendEmailOTP = async () => {
    if (validateField('email', formData.email)) {
      try {
        const response = await axios.post(
          'http://localhost:3040/auth/update-user/send-otp-email',
          { email: formData.email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Email OTP sent:', response.data);
        setEmailSent(true);
        startTimer();
      } catch (error) {
        console.error('Error sending email OTP:', error);
        setErrors({ ...errors, email: 'Failed to send OTP. Please try again.' });
      }
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (validateField('emailOtp', formData.emailOtp)) {
      try {
        const response = await axios.post(
          'http://localhost:3040/auth/update-user/verify-otp-email',
          {
            email: formData.email,
            otp: formData.emailOtp,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Email OTP verified:', response.data);
        setEmailVerified(true);
      } catch (error) {
        console.error('Error verifying email OTP:', error);
        setErrors({ ...errors, emailOtp: 'Invalid OTP. Please try again.' });
      }
    }
  };

  const handleSendMobileOTP = async () => {
    if (validateField('mobile', formData.mobile)) {
      try {
        const response = await axios.post(
          'http://localhost:3040/auth/update-user/send-otp-mobile',
          { mobile: formData.mobile },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Mobile OTP sent:', response.data);
        setMobileSent(true);
        startTimer();
      } catch (error) {
        console.error('Error sending mobile OTP:', error);
        setErrors({ ...errors, mobile: 'Failed to send OTP. Please try again.' });
      }
    }
  };

  const handleVerifyMobileOTP = async () => {
    if (validateField('mobileOtp', formData.mobileOtp)) {
      try {
        const response = await axios.post(
          'http://localhost:3040/auth/update-user/verify-otp-mobile',
          {
            mobile: formData.mobile,
            otp: formData.mobileOtp,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Mobile OTP verified:', response.data);
        setMobileVerified(true);
      } catch (error) {
        console.error('Error verifying mobile OTP:', error);
        setErrors({ ...errors, mobileOtp: 'Invalid OTP. Please try again.' });
      }
    }
  };

  const startTimer = () => {
    setTimer(300);
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create an object to hold only the modified fields
    const updateUserDto: Partial<UserCredentials> = {};

    // Check which fields have been modified and add them to updateUserDto
    if (formData.firstName.trim() !== '') {
      if (!validateField('firstName', formData.firstName)) return;
      updateUserDto.firstName = formData.firstName;
    }

    if (formData.lastName.trim() !== '') {
      if (!validateField('lastName', formData.lastName)) return;
      updateUserDto.lastName = formData.lastName;
    }

    if (formData.email.trim() !== '') {
      if (!validateField('email', formData.email)) return;
      updateUserDto.email = formData.email;
    }

    if (formData.mobile.trim() !== '') {
      if (!validateField('mobile', formData.mobile)) return;
      updateUserDto.mobile = formData.mobile;
    }

    if (formData.password.trim() !== '') {
      if (!validateField('password', formData.password)) return;
      updateUserDto.password = formData.password;
    }

    if (formData.country.trim() !== '') {
      updateUserDto.country = formData.country;
      updateUserDto.countryCode = formData.countryCode;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateUserDto).length === 0) {
      alert('No fields to update.');
      return;
    }

    try {
      const response = await axios.put('http://localhost:3040/auth/update-user', updateUserDto, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('User updated:', response.data);

      alert('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Update failed. Please try again.');
    }
  };

  return (
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
          Update Profile
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter your credentials to continue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Grid container spacing={2}>
            {/* First Name Field */}
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

            {/* Last Name Field */}
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

            {/* Email Field */}
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
                  bgcolor: emailVerified ? '#fff' : '#fffde7',
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
                disabled={emailVerified || timer > 0 || !formData.email}
                sx={{ height: '56px' }}
              >
                {timer > 0
                  ? `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                  : 'Send OTP'}
              </Button>
            </Grid>

            {/* Email OTP Field */}
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
                disabled={!emailSent || emailVerified}
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
                disabled={!emailSent || emailVerified || !formData.emailOtp}
                sx={{ height: '56px' }}
              >
                Verify OTP
              </Button>
            </Grid>

            {/* Country Field */}
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

            {/* Mobile Field */}
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
                  bgcolor: mobileVerified ? '#fff' : '#f9f9f9',
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
                disabled={mobileVerified || timer > 0 || !formData.mobile}
                sx={{ height: '56px' }}
              >
                {timer > 0
                  ? `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                  : 'Send OTP'}
              </Button>
            </Grid>

            {/* Mobile OTP Field */}
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
                disabled={!mobileSent || mobileVerified}
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
                disabled={!mobileSent || mobileVerified || !formData.mobileOtp}
                sx={{ height: '56px' }}
              >
                Verify OTP
              </Button>
            </Grid>

            {/* Password Field */}
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
                  inputProps={{
                    maxLength: 20,
                    placeholder: 'Enter your password',
                  }}
                />
                <FormHelperText error={!!errors.password}>{errors.password}</FormHelperText>
              </FormControl>
            </Grid>

            {/* Terms & Conditions Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeTnC"
                    checked={formData.agreeTnC}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I agree to the Terms & Conditions"
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
                sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
              >
                Update Profile
              </Button>
            </Grid>

            {/* Back to Profile Link */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Back to Profile
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
