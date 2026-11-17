interface AdminHeaderProps {
  setIsSidebarOpen: (value: boolean) => void;
  isSidebarOpen: boolean;
}

export default function AdminHeader({ setIsSidebarOpen, isSidebarOpen }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none md:hidden">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm font-semibold text-gray-600">Admin User</span>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">A</div>
      </div>
    </header>
  );
}
