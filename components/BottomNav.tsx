export default function BottomNav() {
  return (
    <nav className="bg-[#1A2C38] border-t border-[#2F4553] fixed bottom-0 w-full flex justify-around items-center py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col items-center text-yellow-400 cursor-pointer">
        <span className="text-xl">🏠</span>
        <span className="text-[10px] font-bold">Home</span>
      </div>
      <div className="flex flex-col items-center text-[#B1BAD3] cursor-pointer">
        <span className="text-xl">🎁</span>
        <span className="text-[10px]">Promotion</span>
      </div>
      
      <div className="relative -top-5 cursor-pointer">
        <button className="w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex flex-col items-center justify-center shadow-lg border-4 border-[#0F212E]">
          <span className="text-2xl">👥</span>
          <span className="text-[10px] font-bold text-black leading-none mt-1">Invite</span>
        </button>
      </div>

      <div className="flex flex-col items-center text-[#B1BAD3] cursor-pointer">
        <span className="text-xl">🏆</span>
        <span className="text-[10px]">Reward</span>
      </div>
      <div className="flex flex-col items-center text-[#B1BAD3] relative cursor-pointer">
        <span className="text-xl">👑</span>
        <span className="text-[10px]">Member</span>
      </div>
    </nav>
  );
}
