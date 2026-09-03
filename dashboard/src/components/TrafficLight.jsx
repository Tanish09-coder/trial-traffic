import { motion } from 'framer-motion';

const TrafficLight = ({ direction, signal, phase = 'GREEN', emergencyActive = false, isFullscreen = false }) => {
  const positions = isFullscreen
    ? {
      N: { top: 'calc(50% - 210px)', left: 'calc(50% - 50px)' }, 
      S: { top: 'calc(50% + 120px)', left: 'calc(50% + 28px)' }, 
      E: { top: 'calc(50% - 30px)', left: 'calc(50% + 275px)' }, 
      W: { top: 'calc(50% - 100px)', left: 'calc(50% - 290px)' }  
    }
    : {
      N: { top: 'calc(50% - 135px)', left: 'calc(50% - 32px)' }, 
      S: { top: 'calc(50% + 75px)', left: 'calc(50% + 16px)' }, 
      E: { top: 'calc(50% - 18px)', left: 'calc(50% + 175px)' }, 
      W: { top: 'calc(50% - 58px)', left: 'calc(50% - 185px)' }  
    };

  const position = positions[direction];

  const isCurrentDir = signal === direction;
  const isGreen = isCurrentDir && phase === 'GREEN';
  const isYellow = isCurrentDir && phase === 'YELLOW';
  const isRed = !isGreen && !isYellow;

  return (
    <div
      className="absolute z-20 flex flex-col items-center select-none pointer-events-none"
      style={position}
    >
      <div className={`bg-[#18181B] rounded-xl shadow-lg border border-gray-800 flex flex-col items-center justify-between ${isFullscreen ? 'w-7 p-1.5 space-y-1' : 'w-5 p-1 space-y-0.5'
        }`}>
        {/* Red light */}
        <motion.div
          className={`rounded-full ${isFullscreen ? 'w-4 h-4' : 'w-2.5 h-2.5'
            } ${isRed ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]' : 'bg-red-950/80'
            }`}
          animate={{
            opacity: isRed ? 1 : 0.3
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Yellow light */}
        <motion.div 
          className={`rounded-full ${isFullscreen ? 'w-4 h-4' : 'w-2.5 h-2.5'
            } ${isYellow ? 'bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.9)]' : 'bg-amber-950/80'
            }`} 
          animate={{
            opacity: isYellow ? 1 : 0.3
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Green light */}
        <motion.div
          className={`rounded-full ${isFullscreen ? 'w-4 h-4' : 'w-2.5 h-2.5'
            } ${isGreen ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-emerald-950/80'
            }`}
          animate={{
            opacity: isGreen ? 1 : 0.3
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className={`mt-0.5 font-extrabold bg-white text-gray-900 shadow-sm text-center flex items-center justify-center ${isFullscreen ? 'w-5 h-3.5 text-[9px] rounded-sm' : 'w-3.5 h-2.5 text-[7px] leading-none rounded-[2px]'
        }`}>
        {direction}
      </div>

      {emergencyActive && isCurrentDir && (
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default TrafficLight;