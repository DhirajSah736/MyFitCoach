import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccessPage: React.FC = () => {
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifySubscription } = useSubscription();
  const { user, loading } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          throw new Error('No session ID found in URL');
        }
        
        console.log('Verifying payment with session ID:', sessionId);
        
        // Verify the payment with Stripe
        const result = await verifySubscription(sessionId);
        
        if (!result.success) {
          throw new Error(result.error || 'Payment verification failed');
        }
        
        console.log('Payment verified successfully:', result);
        setVerifying(false);
        
        // Start countdown after verification
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setVerifying(false);
      }
    };
    
    // Only verify payment when auth loading is complete and user is authenticated
    if (!loading && user) {
      verifyPayment();
    } else if (!loading && !user) {
      // If not authenticated after loading is complete, redirect to auth
      setError('Authentication required. Redirecting to login...');
      setVerifying(false);
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [location.search, navigate, verifySubscription, user, loading]);

  // Show loading while auth is still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we authenticate your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Payment</h1>
            <p className="text-gray-600">Please wait while we confirm your payment with Stripe...</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your premium subscription is now active.
            </p>
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-purple-800">
                Redirecting to your dashboard in <span className="font-bold">{countdown}</span> seconds...
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
            >
              Go to Dashboard Now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;