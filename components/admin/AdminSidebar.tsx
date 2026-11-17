import Link from "next/link";
import { menuItems } from "../../lib/adminMenu";

interface AdminSidebarProps {
  pathname: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

export default function AdminSidebar({ pathname, isSidebarOpen, setIsSidebarOpen }: AdminSidebarProps) {
  return (
    <>
      {/* 🌟 মোবাইলের জন্য ওভারলে (সাইডবার খোলা থাকলে পেছনের অংশ কালো হবে) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🌟 সাইডবার কন্টেইনার (মোবাইলে স্লাইড করবে) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between border-b border-gray-200 px-4 md:justify-center">
          <Link href="/admin" className="text-xl font-extrabold text-blue-600 tracking-wider uppercase">
            Admin Panel
          </Link>
          {/* মোবাইলে বন্ধ করার বাটন */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    onClick={() => setIsSidebarOpen(false)} // ক্লিক করলে মোবাইলে সাইডবার বন্ধ হবে
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="font-semibold text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Area */}
        <div className="p-4 border-t border-gray-200">
          <Link href="/" className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}
