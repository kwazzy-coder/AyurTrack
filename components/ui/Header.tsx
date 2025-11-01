
import React from 'react';
import { User } from '../../types';
import { Leaf, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Leaf size={28} />
        <h1 className="text-xl font-bold">AyurTrack</h1>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className='text-right hidden sm:block'>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs opacity-80">{user.role}</p>
          </div>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-primary-focus transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
