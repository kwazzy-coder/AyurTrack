import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ArrowLeft, MapPin } from 'lucide-react';
import { UserRole } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';

const AuthScreen: React.FC = () => {
  const { selectedRole, login, loading, error, resetRole } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert('Please enter your email and password.');
      return;
    }
    login(loginEmail, loginPassword);
  };

  return (
    <div>
      <button onClick={resetRole} className="flex items-center gap-2 text-sm text-primary mb-4 hover:underline">
          <ArrowLeft size={16} /> Back to Role Selection
      </button>

      <h2 className="text-2xl font-bold mb-2">{isRegistering ? 'Register' : 'Login'} as {selectedRole}</h2>
      <p className="text-text-secondary mb-6">
        {isRegistering ? 'Fill in your details to create an account.' : 'Enter your credentials to access your dashboard.'}
      </p>

      {isRegistering ? (
        <RegistrationForm />
      ) : (
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            id="email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder={`e.g. ${{'Farmer': 'ram@farm.com', 'Collector': 'sita@collect.com', 'Lab Technician': 'kumar@lab.com', 'Manufacturer': 'contact@ayuwell.com'}[selectedRole || '']}`}
            autoComplete="email"
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Use 'password' for demo"
            autoComplete="current-password"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button type="submit" isLoading={loading}>
            Login
          </Button>
        </form>
      )}

      <div className="mt-4 text-center">
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-primary hover:underline">
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

const RegistrationForm: React.FC = () => {
    const { register, loading, selectedRole } = useAuth();
    const [formData, setFormData] = useState<any>({});
    const {data: location, loading: locationLoading, error: locationError } = useGeolocation();
    const [formError, setFormError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (selectedRole === UserRole.Farmer && !location) {
            setFormError("Location is required for farmer registration and is still being fetched or has been denied.");
            return;
        }

        const registrationData = {
            ...formData,
            ...(selectedRole === UserRole.Farmer && { location }),
        };

        try {
            await register(registrationData);
            // On success, user will be redirected by the main App component
        } catch (err) {
            setFormError((err as Error).message);
        }
    };

    const renderRoleSpecificFields = () => {
        switch(selectedRole) {
            case UserRole.Farmer:
                return <>
                    <Input label="Full Address" name="address" type="text" onChange={handleChange} required />
                    <Input label="Aadhar Number" name="aadhar" type="text" onChange={handleChange} required />
                    <div className="mb-4 p-2 bg-gray-100 rounded-md">
                        <p className="text-sm font-medium text-text-secondary mb-1">GPS Location</p>
                        {locationLoading && <p className="text-sm">Fetching location...</p>}
                        {locationError && <p className="text-sm text-red-500">{locationError}</p>}
                        {location && <p className="text-sm flex items-center gap-1"><MapPin size={14} /> Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}</p>}
                    </div>
                </>;
            case UserRole.Lab:
                return <>
                    <Input label="Lab Registration ID" name="labRegId" type="text" onChange={handleChange} required />
                </>;
            case UserRole.Manufacturer:
                return <>
                    <Input label="GSTIN" name="gstin" type="text" onChange={handleChange} required />
                    <Input label="Manufacturer ID" name="manufacturerId" type="text" onChange={handleChange} required />
                </>;
            default:
                return null;
        }
    }

    return (
         <form onSubmit={handleSubmit}>
            <Input label={selectedRole === UserRole.Lab ? 'Lab Name' : selectedRole === UserRole.Manufacturer ? 'Company Name' : 'Full Name'} name="name" type="text" onChange={handleChange} required />
            <Input label="Email" name="email" type="email" onChange={handleChange} required />
            <Input label="Password" name="password" type="password" onChange={handleChange} required />
            <Input label="Phone Number" name="phone" type="tel" onChange={handleChange} required />
            
            {renderRoleSpecificFields()}

            {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
            <Button type="submit" isLoading={loading} disabled={selectedRole === UserRole.Farmer && locationLoading}>
                Register
            </Button>
        </form>
    )
}

export default AuthScreen;