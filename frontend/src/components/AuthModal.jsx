import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setTab('login')}
            className={`flex-1 pb-3 text-sm font-bold transition border-b-2 ${tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Đăng nhập
          </button>
          <button 
            onClick={() => setTab('register')}
            className={`flex-1 pb-3 text-sm font-bold transition border-b-2 ${tab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert(`Đã gửi yêu cầu ${tab}!`); onClose(); }} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input required type="text" placeholder="Nguyễn Văn A" className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input required type="email" placeholder="example@vedu.edu.vn" className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input required type="password" placeholder="••••••••" className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/20">
            {tab === 'login' ? 'Đăng nhập vào Vedu' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}