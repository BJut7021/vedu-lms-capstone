import React from 'react';
import { Search, BookOpen, LogIn } from 'lucide-react';

export default function Header({ onOpenAuth }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
            V
          </div>
          <div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Vedu</span>
            <span className="text-xs block text-blue-600 font-semibold -mt-1">LMS Platform</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition">
            <BookOpen size={18} />
            <span>Khóa học</span>
          </button>
          <a href="#lo-trinh" className="hover:text-blue-600 transition">Lộ trình thông minh</a>
          <a href="#ho-tro" className="hover:text-blue-600 transition">Hỗ trợ</a>
        </nav>

        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm khóa học, kỹ năng, giảng viên..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenAuth('login')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            Đăng nhập
          </button>
          <button 
            onClick={() => onOpenAuth('register')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow transition flex items-center gap-1.5"
          >
            <LogIn size={16} />
            <span>Đăng ký</span>
          </button>
        </div>
      </div>
    </header>
  );
}