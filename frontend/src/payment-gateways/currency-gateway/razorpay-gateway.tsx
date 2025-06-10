import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';
import RazorpayService from '../../Services/api-services/payment-gateway-service/razorpay-gatway-service';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentGatewayProps {
  planId: string;
  couponCode: string;
  amount: number;
  currency: string;
  paymentType: 'createBroker' | 'renewBroker' | 'tradingJournalActivate' | 'tradingJournalRenew' | 'alertActivate' | 'alertRenew' | 'penaltyPlan';
  data: {
    marketTypeId?: string;
    brokerId?: string;
    subAccountName?: string;
    brokerRenewId?: string;
    journalId?: string;
    alertId?: string;
    penaltyId?: string;
  };
}

export default function PaymentGateway({
  planId,
  couponCode,
  amount,
  currency,
  paymentType,
  data,
}: PaymentGatewayProps) {
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const isInitiated = useRef(false);

  const validateData = () => {
    switch (paymentType) {
      case 'createBroker':
        return data.marketTypeId && data.brokerId && data.subAccountName;
      case 'renewBroker':
        return data.brokerRenewId;
      case 'tradingJournalActivate':

      case 'tradingJournalRenew':
        return data.journalId;
      case 'alertActivate':
      case 'alertRenew':
        return data.alertId;
      case 'penaltyPlan':
        return data.penaltyId;
      default:
        return false;
    }
  };

  const getPaymentDescription = () => {
    switch (paymentType) {
      case 'createBroker': return 'Payment for new broker account';
      case 'renewBroker': return 'Renewal of broker plan';
      case 'tradingJournalActivate': return 'Trading journal activation';
      case 'tradingJournalRenew': return 'Trading journal renewal';
      case 'alertActivate': return 'Alert activation';
      case 'alertRenew': return 'Alert renewal';
      case 'penaltyPlan': return 'Penalty plan payment';
      default: return 'Payment for service';
    }
  };

  const getSuccessRedirectPath = () => {
    switch (paymentType) {
      case 'createBroker': return '/add-broker-rules';
      case 'renewBroker': return '/add-broker-rules';
      case 'tradingJournalActivate': return '/add-broker-rules';
      case 'tradingJournalRenew': return '/add-broker-rules';
      case 'alertActivate': return '/add-broker-rules';
      case 'alertRenew': return '/add-broker-rules';
      case 'penaltyPlan': return '/add-broker-rules';
      default: return '/';
    }
  };

  const getPaymentName = () => {
    switch (paymentType) {
      case 'createBroker': return 'RiskDefender - New Broker';
      case 'renewBroker': return 'RiskDefender - Broker Renewal';
      case 'tradingJournalActivate': return 'RiskDefender - Journal Activation';
      case 'tradingJournalRenew': return 'RiskDefender - Journal Renewal';
      case 'alertActivate': return 'RiskDefender - Alert Activation';
      case 'alertRenew': return 'RiskDefender - Alert Renewal';
      case 'penaltyPlan': return 'RiskDefender - Penalty Plan';
      default: return 'RiskDefender';
    }
  };

  const getPaymentData = () => {
    switch (paymentType) {
      case 'createBroker':
        return { marketTypeId: data.marketTypeId, brokerId: data.brokerId, subAccountName: data.subAccountName };
      case 'renewBroker':
        return { renewId: data.brokerRenewId };
      case 'tradingJournalActivate':
        return { marketTypeId: data.marketTypeId, brokerId: data.brokerId, subAccountName: data.subAccountName };
      case 'tradingJournalRenew':
        return { journalId: data.journalId };
      case 'alertActivate':
        return { marketTypeId: data.marketTypeId, brokerId: data.brokerId, subAccountName: data.subAccountName };
      case 'alertRenew':
        return { alertId: data.alertId };
      case 'penaltyPlan':
        return { penaltyId: data.penaltyId };
      default:
        return {};
    }
  };

  const initiatePayment = useCallback(async () => {
    if (isInitiated.current) return;
    isInitiated.current = true;

    if (!validateData()) {
      setStatusMessage('Missing required data for payment');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const orderResponse = await RazorpayService.createPayment({
        planId,
        couponCode,
        amount,
        currency,
        paymentType,
        data: getPaymentData(),
      });

      if (!orderResponse?.success || !orderResponse?.data) {
        throw new Error(orderResponse?.message || 'Invalid payment response from server');
      }
      if (!orderResponse.data.amount || !orderResponse.data.currency || !orderResponse.data.orderId || !orderResponse.data.keyId) {
        throw new Error('Required payment details missing in response');
      }

      const options = {
        key: orderResponse.data.keyId,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        order_id: orderResponse.data.orderId,
        name: getPaymentName(),
        description: getPaymentDescription(),
        notes: {
          paymentType,
          description: getPaymentDescription(),
          ...getPaymentData(),
        },
        handler: async (response: any) => {
          try {
            await RazorpayService.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              amount: amount / 100, // Use prop amount, already in paisa/cents
              planId,
              paymentType,
              currency,
              brokerRenewId:data.brokerRenewId,
              journalId: data.journalId,
              alertId: data.alertId,
              penaltyId: data.penaltyId,
              couponCode,
            });
            setStatusMessage('Payment successful!');
            navigate(getSuccessRedirectPath());
          } catch (error) {
            setStatusMessage('Payment verification failed');
          }
        },
        prefill: {
          email: orderResponse.data.email,
          contact: orderResponse.data.mobile,
        },
        theme: { color: '#3399cc' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setStatusMessage(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error: any) {
      let errorMessage = 'Payment initialization failed';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      setStatusMessage(`Payment initialization failed: ${errorMessage}`);
      console.error('Payment initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, [planId, couponCode, amount, currency, paymentType, data, navigate]);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadRazorpay = () => {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => initiatePayment();
      script.onerror = () => setStatusMessage('Failed to load payment gateway. Please refresh.');
      document.body.appendChild(script);
    };

    if (!window.Razorpay && !isInitiated.current) {
      loadRazorpay();
    } else if (window.Razorpay && !isInitiated.current) {
      initiatePayment();
    }

    return () => {
      if (script) document.body.removeChild(script);
    };
  }, [initiatePayment]);

  return (
    <Box>
      {loading && <CircularProgress size={24} />}
      {statusMessage && (
        <Alert severity={statusMessage.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {statusMessage}
        </Alert>
      )}
    </Box>
  );
}