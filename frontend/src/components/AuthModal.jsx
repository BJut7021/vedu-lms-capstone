import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User, X } from 'lucide-react';
import { api } from '../services/api';

const roleInfo = {
  STUDENT: { label: 'Học viên', username: 'student' },
  TEACHER: { label: 'Giảng viên', username: 'teacher' },
  ADMIN: { label: 'Quản trị viên', username: 'admin' },
};

function PasswordInput({ value, onChange, placeholder, autoComplete, name }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input name={name} required minLength={8} maxLength={72} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border py-2.5 pl-9 pr-11 text-sm outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>;
}

function Field({ label, icon: Icon, error, ...inputProps }) {
  return <label className="block text-xs font-semibold text-gray-700">{label}<div className="relative mt-1"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input {...inputProps} className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-300' : 'focus:ring-blue-500'}`} /></div>{error && <span className="mt-1 block text-[11px] font-medium text-red-600">{error}</span>}</label>;
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onAuthenticated, expectedRole = 'STUDENT', allowRegister = expectedRole === 'STUDENT', allowForgot = expectedRole !== 'ADMIN' }) {
  const [tab, setTab] = useState(defaultTab === 'register' && !allowRegister ? 'login' : defaultTab);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const info = roleInfo[expectedRole];

  if (!isOpen) return null;

  const changeTab = (nextTab) => { setTab(nextTab); setErrors({}); setMessage(''); };
  const validate = () => {
    const next = {};
    if (!/^[a-zA-Z0-9._]{4,30}$/.test(form.username)) next.username = 'Username gồm 4-30 ký tự chữ, số, dấu chấm hoặc gạch dưới.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(form.password)) next.password = 'Cần 8-72 ký tự, có chữ hoa, chữ thường và số.';
    if (tab === 'register') {
      if (form.fullName.trim().length < 2) next.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email không đúng định dạng.';
      if (!/^(?:0|\+84)\d{9}$/.test(form.phone.replace(/[\s.-]/g, ''))) next.phone = 'Nhập số Việt Nam dạng 09xxxxxxxx hoặc +84xxxxxxxxx.';
      if (form.confirmPassword !== form.password) next.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUsernameBlur = async () => {
    if (tab !== 'register' || !/^[a-zA-Z0-9._]{4,30}$/.test(form.username)) return;
    try {
      const result = await api.usernameAvailability(form.username);
      setErrors((current) => ({ ...current, username: result.available ? '' : 'Username đã tồn tại.' }));
    } catch (error) { setErrors((current) => ({ ...current, username: error.message })); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setMessage('');
    try {
      if (tab === 'register') {
        const availability = await api.usernameAvailability(form.username);
        if (!availability.available) { setErrors({ username: 'Username đã tồn tại.' }); return; }
        await api.register(form);
      }
      const result = await api.login({ username: form.username, password: form.password, expectedRole, deviceInfo: 'Vedu web' });
      onAuthenticated(result);
    } catch (error) { setErrors({ form: error.message }); }
    finally { setSubmitting(false); }
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErrors({ email: 'Email không đúng định dạng.' }); return; }
    setSubmitting(true); setErrors({});
    try {
      const result = await api.forgotPassword(form.email, expectedRole);
      setMessage(`${result.message} Hiệu lực ${result.expiresInSeconds} giây.`);
      if (result.demoResetPin) setPin(result.demoResetPin);
      setTab('reset');
    } catch (error) { setErrors({ form: error.message }); }
    finally { setSubmitting(false); }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^\d{6}$/.test(pin)) next.pin = 'PIN phải gồm đúng 6 chữ số.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(newPassword)) next.newPassword = 'Cần 8-72 ký tự, có chữ hoa, chữ thường và số.';
    if (newPassword !== confirmNewPassword) next.confirmNewPassword = 'Mật khẩu nhập lại không khớp.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true); setErrors({});
    try {
      const result = await api.resetPassword({ email: form.email, pin, newPassword, expectedRole });
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setPin(''); setNewPassword(''); setConfirmNewPassword(''); setTab('login'); setMessage(result.message);
    } catch (error) { setErrors({ form: error.message }); }
    finally { setSubmitting(false); }
  };

  const authTab = tab === 'login' || tab === 'register';
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><div className="relative my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
    <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700" aria-label="Đóng"><X size={20} /></button>
    <div className="mb-5 pr-8"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Cổng {info.label}</p><h2 className="mt-1 text-xl font-black text-slate-900">{tab === 'login' ? 'Đăng nhập Vedu' : tab === 'register' ? 'Tạo tài khoản học viên' : tab === 'forgot' ? 'Nhận mã PIN qua email' : 'Đặt mật khẩu mới'}</h2></div>
    {authTab && allowRegister && <div className="mb-5 flex border-b"><button onClick={() => changeTab('login')} className={`flex-1 border-b-2 pb-3 text-sm font-bold ${tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Đăng nhập</button><button onClick={() => changeTab('register')} className={`flex-1 border-b-2 pb-3 text-sm font-bold ${tab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Đăng ký</button></div>}
    {authTab && <form onSubmit={handleSubmit} className="space-y-3.5">
      {tab === 'register' && <Field label="Họ và tên" icon={User} required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} error={errors.fullName} autoComplete="name" placeholder="Nguyễn Văn A" />}
      <Field label="Username" icon={User} required value={form.username} onBlur={handleUsernameBlur} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })} error={errors.username} autoComplete="username" placeholder={info.username} />
      {tab === 'register' && <Field label="Email cá nhân" icon={Mail} required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} error={errors.email} autoComplete="email" placeholder="ban@gmail.com" />}
      {tab === 'register' && <Field label="Số điện thoại" icon={Phone} required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} error={errors.phone} autoComplete="tel" placeholder="0901234567" />}
      <label className="block text-xs font-semibold text-gray-700">Mật khẩu<div className="mt-1"><PasswordInput name="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Demo@123" autoComplete={tab === 'register' ? 'new-password' : 'current-password'} /></div>{errors.password && <span className="mt-1 block text-[11px] text-red-600">{errors.password}</span>}</label>
      {tab === 'register' && <label className="block text-xs font-semibold text-gray-700">Nhập lại mật khẩu<div className="mt-1"><PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Nhập lại mật khẩu" autoComplete="new-password" /></div>{errors.confirmPassword && <span className="mt-1 block text-[11px] text-red-600">{errors.confirmPassword}</span>}</label>}
      {tab === 'login' && allowForgot && <button type="button" onClick={() => changeTab('forgot')} className="block w-full text-right text-xs font-bold text-blue-600">Quên mật khẩu?</button>}
      {tab === 'login' && <button type="button" onClick={() => setForm({ ...form, username: info.username, password: 'Demo@123' })} className="w-full rounded-xl border border-blue-100 bg-blue-50 p-3 text-left text-xs text-blue-700"><strong>Điền tài khoản demo:</strong> {info.username} / Demo@123</button>}
      {errors.form && <p className="text-sm font-semibold text-red-600">{errors.form}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      <button disabled={submitting || Boolean(errors.username)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">{submitting ? 'Đang xử lý...' : tab === 'login' ? `Đăng nhập ${info.label}` : 'Tạo tài khoản'}</button>
    </form>}
    {tab === 'forgot' && <form onSubmit={handleForgot} className="space-y-4"><button type="button" onClick={() => changeTab('login')} className="flex items-center gap-1 text-xs font-bold text-blue-600"><ArrowLeft size={15} /> Quay lại</button><Field label="Email cá nhân đã đăng ký" icon={Mail} required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} error={errors.email} placeholder="ban@gmail.com" />{errors.form && <p className="text-sm font-semibold text-red-600">{errors.form}</p>}<button disabled={submitting} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white">Gửi mã PIN</button></form>}
    {tab === 'reset' && <form onSubmit={handleReset} className="space-y-4"><button type="button" onClick={() => changeTab('forgot')} className="flex items-center gap-1 text-xs font-bold text-blue-600"><ArrowLeft size={15} /> Gửi lại mã</button>{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<Field label="Mã PIN 6 chữ số" icon={Lock} required inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} error={errors.pin} placeholder="123456" /><label className="block text-xs font-semibold">Mật khẩu mới<div className="mt-1"><PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Mật khẩu mới" /></div>{errors.newPassword && <span className="text-[11px] text-red-600">{errors.newPassword}</span>}</label><label className="block text-xs font-semibold">Nhập lại mật khẩu mới<div className="mt-1"><PasswordInput value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} autoComplete="new-password" placeholder="Nhập lại mật khẩu" /></div>{errors.confirmNewPassword && <span className="text-[11px] text-red-600">{errors.confirmNewPassword}</span>}</label>{errors.form && <p className="text-sm font-semibold text-red-600">{errors.form}</p>}<button disabled={submitting} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white">Đặt lại mật khẩu</button></form>}
  </div></div>;
}
