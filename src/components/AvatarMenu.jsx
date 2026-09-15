import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../auth';
import { User, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AvatarMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const loggedIn = isLoggedIn();
  const user = getUser();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (loggedIn) {
      navigate('/profile');
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setIsOpen(false);
    navigate('/login', { state: { tab: 'register' } });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={handleAvatarClick}
        className="p-2 bg-surface hover:bg-surface-hover border border-border rounded-full transition flex items-center justify-center text-text hover:text-primary shadow-sm"
        title={loggedIn ? "Profil Saya" : "Akun"}
      >
        {loggedIn && user?.name ? (
          <div className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full font-bold text-xs uppercase">
            {user.name.charAt(0)}
          </div>
        ) : (
          <User size={20} />
        )}
      </button>

      <AnimatePresence>
        {!loggedIn && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="py-2">
              <button
                onClick={handleLoginClick}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-surface-hover hover:text-primary transition flex items-center gap-3"
              >
                <LogIn size={16} />
                <span>Masuk</span>
              </button>
              <button
                onClick={handleRegisterClick}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-surface-hover hover:text-primary transition flex items-center gap-3"
              >
                <UserPlus size={16} />
                <span>Daftar Akun Baru</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
