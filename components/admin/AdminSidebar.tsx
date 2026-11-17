import Link from "next/link";
import { menuItems } from "../../lib/adminMenu";

interface AdminSidebarProps {
  pathname: string;
  isSidebarOpen: boolean;
}

export default function AdminSidebar({ pathname, isSidebarOpen }: AdminSidebarProps) {
  return (
    <aside className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
      
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <Link href="/admin" className="text-xl font-extrabold text-blue-600 tracking-wider uppercase">
          Admin Panel
        </Link>
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
  );
}
