import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

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
       <Link
                 to="/"
                 className="inline-flex items-center justify-center gap-3 mb-4"
                 aria-label="Go to home"
               >
                 <img
                   src={`${API_BASE_URL}/uploads/gadalogo.png`}
                   alt="Gada logo"
                   className="h-12 w-12 object-contain"
                 />
                 <span className="text-[#1877F2] text-5xl font-bold leading-none">Gada.chat</span>
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