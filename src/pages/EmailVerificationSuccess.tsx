import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Dumbbell } from 'lucide-react';

const EmailVerificationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [isCheckmarkVisible, setIsCheckmarkVisible] = useState(false);

  useEffect(() => {
    // Animate the checkmark after a short delay
    const timer = setTimeout(() => {
      setIsCheckmarkVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-lg max-w-[600px] w-full p-6 sm:p-8 text-center"
        style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 sm:w-[120px] sm:h-[120px] bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
          </div>
        </div>

        {/* Checkmark Icon */}
        <div 
          className={`w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 transform transition-all duration-500 ${
            isCheckmarkVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          <CheckCircle className="w-10 h-10 sm:w-14 sm:h-14 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Email Verified Successfully!
        </h1>
        
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
          Thank you for verifying your email! Your MyFitCoach account is now active and ready for your fitness journey.
        </p>

        {/* CTA Button - Fixed width removed for better responsiveness */}
        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md w-full sm:w-auto sm:min-w-[200px]"
          >
            Log In to MyFitCoach
          </button>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse hidden sm:block"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-orange-200/30 rounded-full blur-xl animate-pulse delay-1000 hidden sm:block"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-purple-300/20 rounded-full blur-lg animate-pulse delay-500 hidden sm:block"></div>
    </div>
  );
};

export default EmailVerificationSuccess;