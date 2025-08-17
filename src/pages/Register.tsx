import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Register() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    // if (user && !isLoading) {
    //   // navigate('/');
    // }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/">
          <h1 className="text-[#1877F2] text-5xl font-bold mb-6">Gada</h1>
        </Link>
        <h2 className="text-gray-900 text-xl">
          Create an account and connect with friends
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}