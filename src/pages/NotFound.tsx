import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center space-y-5">
        <h1 className="text-6xl font-bold text-[#1877F2]">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-4 bg-[#1877F2] hover:bg-[#166FE5]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
}