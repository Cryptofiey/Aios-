import React from 'react';
import { SystemState, getThemeClasses, ThemeColors } from './Theme';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

interface OSWindowProps {
  title: string;
  state?: SystemState;
  children: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  animateBorder?: boolean;
}

export const OSWindow: React.FC<OSWindowProps> = ({ 
  title, 
  state = 'system', 
  children, 
  icon,
  actions,
  className = '',
  animateBorder = true
}) => {
  const themeClasses = getThemeClasses(state, animateBorder);
  const theme = ThemeColors[state];

  // Динамическая реакция обертки на состояние
  const renderIndicator = () => {
    switch (state) {
      case 'thinking': return <div className="h-2 w-2 rounded-full bg-fuchsia-400 animate-ping" />;
      case 'executing': return <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />;
      case 'success': return <div className="h-2 w-2 rounded-full bg-emerald-400" />;
      case 'error': return <div className="h-2 w-2 rounded-full bg-rose-400" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border flex flex-col rounded-md overflow-hidden transition-all duration-300 ${themeClasses} ${className}`}
    >
      {/* Container Header (Titlebar) */}
      <div className={`px-2 py-1.5 border-b flex items-center justify-between ${theme.border} bg-black/40 backdrop-blur-sm shrink-0`}>
        <div className="flex items-center gap-1.5">
          {icon ? <span className={theme.icon}>{icon}</span> : <Terminal className={`w-3.5 h-3.5 ${theme.icon}`} />}
          <span className="text-xs font-semibold tracking-wide uppercase">{title}</span>
          {renderIndicator()}
        </div>
        <div className="flex items-center gap-1">
          {actions}
        </div>
      </div>
      
      {/* Container Content (Inner Box) */}
      <div className="flex-1 overflow-hidden relative p-1 flex flex-col">
        {children}
        
        {/* Animated scanning line effect for thinking/executing states */}
        {state === 'thinking' && (
          <motion.div 
            className="absolute left-0 right-0 h-1 bg-fuchsia-500/30 blur-[2px] pointer-events-none"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
};
