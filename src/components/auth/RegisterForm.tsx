import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RegisterForm() {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstname || !lastname || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const success = await register(firstname, lastname, username, email, password);
      if (success) {
        setSuccess('Registration completed successfully, Please check your email and activate the account');
        window.setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError('Email is already in use');
      }
    } catch (err) {
      setError('An error occurred.' + err + ' Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#1877F2] font-bold">Create an Account</CardTitle>
        <CardDescription>Join Gada today and connect with friends</CardDescription>
      </CardHeader>
      <CardContent>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstname">First Name</Label>
            <Input
              id="firstname"
              placeholder="John"
              value={firstname}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastname">Last Name</Label>
            <Input
              id="lastname"
              placeholder="Doe"
              value={lastname}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">User Name</Label>
            <Input
              id="username"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300"
            />
          </div>
          
          {/* Password field with eye toggle */}
          <div className="space-y-2 relative">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {/* Confirm password field with eye toggle */}
          <div className="space-y-2 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-gray-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#42B72A] hover:bg-[#36A420] text-white"
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="space-y-2 mt-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2 text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-[#1877F2] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
