
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Leaf, Beaker, Factory } from 'lucide-react';
import Button from '../ui/Button';

const roles = [
  { role: UserRole.Farmer, icon: <Leaf />, description: "Cultivate and list your herbs." },
  { role: UserRole.Lab, icon: <Beaker />, description: "Test and certify herb quality." },
  { role: UserRole.Manufacturer, icon: <Factory />, description: "View and source certified herbs." },
];

const RoleSelectionScreen: React.FC = () => {
  const { selectRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-2 text-center">Welcome to AyurTrack</h2>
      <p className="text-text-secondary mb-8 text-center">Please select your role to continue.</p>
      <div className="grid grid-cols-1 gap-4 w-full">
        {roles.map(({ role, icon, description }) => (
          <button
            key={role}
            onClick={() => selectRole(role)}
            className="w-full bg-surface p-4 rounded-lg shadow-md hover:shadow-lg hover:border-primary border-2 border-transparent transition-all text-left flex items-center gap-4"
          >
            <div className="text-primary bg-background p-3 rounded-full">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold">{role}</h3>
                <p className="text-sm text-text-secondary">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
