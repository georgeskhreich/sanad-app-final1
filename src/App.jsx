import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsrsXxn0ugZos5lxYcPSAr3SJYRMibXnQ",
  authDomain: "ain-ebel-sanad-2df2e.firebaseapp.com",
  projectId: "ain-ebel-sanad-2df2e",
  storageBucket: "ain-ebel-sanad-2df2e.firebasestorage.app",
  messagingSenderId: "827000709964",
  appId: "1:827000709964:web:803f3f03bbc455cdfb65e9",
  measurementId: "G-CSK449Y71Z"
};

let db, auth;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init skipped:", e);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [reports] = useState([
    { id: "REP-101", owner: "مارون خريش", status: "قيد المراجعة" },
    { id: "REP-102", owner: "جان طنوس", status: "معتمد" }
  ]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const users = [
    { id: "u1", username: "admin", role: "Admin", name: "المدير العام", pass: "admin123" },
    { id: "u2", username: "super", role: "Supervisor", name: "المشرف", pass: "super123" },
    { id: "u3", username: "eng", role: "Field_Engineer", name: "مهندس ميداني", pass: "eng123" }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === loginForm.username.trim() && u.pass === loginForm.password.trim());
    if (foundUser) {
      setCurrentUser(foundUser);
      setCurrentTab(foundUser.role === 'Field_Engineer' ? 'form' : 'dashboard');
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <h1 className="text-2xl font-black text-emerald-800 text-center mb-6">سَنَد - بلدية عين إبل</h1>
          {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="اسم المستخدم" className="w-full p-3 border rounded-xl" onChange={e => setLoginForm({...loginForm, username: e.target.value})} required/>
            <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl" onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <nav className="bg-white p-4 rounded-xl shadow mb-6 flex justify-between items-center">
        <h2 className="font-bold text-emerald-800">أهلاً {currentUser.name}</h2>
        <button onClick={() => setCurrentUser(null)} className="text-red-600 text-xs font-bold">خروج</button>
      </nav>
      
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">
          {currentTab === 'dashboard' ? 'لوحة التحكم' : 'استمارة المعاينة'}
        </h2>
        
        {currentUser.role !== 'Field_Engineer' && (
          <div className="flex gap-4 mb-6 border-b pb-2">
            <button onClick={() => setCurrentTab('dashboard')} className={currentTab === 'dashboard' ? 'font-bold text-emerald-700' : ''}>التقارير</button>
            <button onClick={() => setCurrentTab('settings')} className={currentTab === 'settings' ? 'font-bold text-emerald-700' : ''}>إدارة الحسابات</button>
          </div>
        )}

        {currentTab === 'dashboard' ? (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="p-4 border rounded-xl bg-gray-50">{r.owner} - الحالة: {r.status}</div>
            ))}
          </div>
        ) : currentTab === 'form' ? (
          <div className="p-4 bg-emerald-50 rounded-xl">هنا ستظهر استمارة المعاينة الميدانية للمهندس.</div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-xl">شاشة إدارة الحسابات (متاحة للأدمن فقط).</div>
        )}
      </div>
    </div>
  );
}
