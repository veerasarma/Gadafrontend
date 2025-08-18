import { useEffect,useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { activateaccount } from '@/services/userServices';
import { toast } from '@/components/ui/use-toast'
import { Alert } from '@/components/ui/alert';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

export default function ActivationPage() {
  const { accessToken,user, isLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>()
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Redirect to home if already authenticated
  useEffect( () => {
    if (!token) {
        navigate('/login')
        return
      }
      if(accessToken)
      {
        navigate('/')
        return
      }
    async function doActivation() {
        try {
        const response = await activateaccount({token:token},headers);
        if(response)
        {
            setSuccess("Your account has been activated successfully, You can login now");
            const timer = window.setTimeout(() => {
                setSuccess('');
                navigate('/login')
              }, 5000); // 3000ms = 3s
              return false;
        }
        } catch (err) {
            console.log(err)
            setError(''+err);
        }
    }
    doActivation();

  },[token, navigate]);
  
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
          Connect with friends and the world around you
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}
      {success && (
          <Alert variant="default" className="mb-4">
            
            {success}
          </Alert>
        )}
        <LoginForm />
      </div>
    </div>
  );
}