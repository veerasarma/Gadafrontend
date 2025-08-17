import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ForgotPassword } from "@/components/auth/ForgotPassword";

export default function Login() {
  const { accessToken,user, isLoading } = useAuth();
  const navigate = useNavigate();
    
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/">
          <h1 className="text-[#1877F2] text-5xl font-bold mb-6">Gada</h1>
        </Link>
        <h2 className="text-gray-900 text-xl">
          Connect with friends and the world around you
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ForgotPassword />
      </div>
    </div>
  );
}