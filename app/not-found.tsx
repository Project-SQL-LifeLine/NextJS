import Link from "next/link";

export default function NotFound() {
  return (
    // পুরো স্ক্রিন জুড়ে কালো ব্লার (Overlay)
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* মাঝখানের কার্ড (Popup) */}
      <div className="bg-[#0d241e] border border-[#26352e] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        
        {/* আইকন */}
        <div className="mx-auto w-16 h-16 bg-[#184f35] rounded-full flex items-center justify-center mb-4 border border-green-500/30">
          <svg className="w-8 h-8 text-[#F5B041]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        {/* টেক্সট */}
        <h1 className="text-3xl font-black text-white tracking-widest mb-2 drop-shadow-md">404</h1>
        <h2 className="text-[13px] font-bold text-gray-300 mb-6">
          পেজটি খুঁজে পাওয়া যায়নি <br/>
          <span className="text-[11px] font-normal text-gray-400">File not found</span>
        </h2>
        
        {/* বাটন */}
        <Link 
          href="/Lottery" 
          className="inline-block w-full bg-[#184f35] text-white border border-[#2e9b4a] py-3 rounded-lg font-bold text-[13px] hover:bg-[#1f6343] transition shadow-[0_4px_15px_rgba(46,155,74,0.3)]"
        >
          হোম পেজে ফিরে যান
        </Link>
      </div>
      
    </div>
  );
}
