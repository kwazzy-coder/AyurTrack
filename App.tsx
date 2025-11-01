import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleSelectionScreen from './components/screens/RoleSelectionScreen';
import AuthScreen from './components/screens/AuthScreen';
import FarmerDashboard from './components/screens/FarmerDashboard';
import LabDashboard from './components/screens/LabDashboard';
import ManufacturerDashboard from './components/screens/ManufacturerDashboard';
import { UserRole } from './types';
import Header from './components/ui/Header';
import { LoaderCircle } from 'lucide-react';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
};

const Main: React.FC = () => {
  const { user, selectedRole, logout, isInitialized } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.Farmer:
        return <FarmerDashboard />;
      case UserRole.Lab:
        return <LabDashboard />;
      case UserRole.Manufacturer:
        return <ManufacturerDashboard />;
      default:
        // This case will be hit if user exists but role is somehow invalid.
        // Defaulting to role selection is a safe fallback.
        return <RoleSelectionScreen />;
    }
  };

  const renderContent = () => {
    if (!isInitialized) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <LoaderCircle className="animate-spin text-primary" size={32} />
          <p className="text-text-secondary">Loading session...</p>
        </div>
      );
    }

    if (user) {
      return renderDashboard();
    }
    
    if (selectedRole) {
      return <AuthScreen />;
    }

    return <RoleSelectionScreen />;
  }

  return (
    <div className="bg-background min-h-screen font-sans text-text">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen flex flex-col">
        <Header user={user} onLogout={logout} />
        <main className="flex-grow p-4 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;