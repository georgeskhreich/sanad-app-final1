import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';

// إعدادات Firebase الآمنة (إذا كانت فارغة، التطبيق سيعمل بوضع المحاكاة ولن ينهار)
const firebaseConfig = {
    apiKey: "AIzaSyCsrsXxn0ugZos5lxYcPSAr3SJYRMibXnQ",
  authDomain: "ain-ebel-sanad-2df2e.firebaseapp.com",
  projectId: "ain-ebel-sanad-2df2e",
  storageBucket: "ain-ebel-sanad-2df2e.firebasestorage.app",
  messagingSenderId: "827000709964",
  appId: "1:827000709964:web:803f3f03bbc455cdfb65e9",
  measurementId: "G-CSK449Y71Z"
};

// تهيئة آمنة لمنع الانهيار
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
  const [isOnline, setIsOnline] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([
    { id: "u1", username: "admin", role: "Admin", name: "المدير العام", pass: "admin123" },
    { id: "u2", username: "super", role: "Supervisor", name: "المشرف", pass: "super123" },
    { id: "u3", username: "eng", role: "Field_Engineer", name: "مهندس ميداني", pass: "eng123" }
  ]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  // تجربة سريعة للتشغيل بدون Firebase إذا فشل الاتصال
  useEffect(() => {
      setReports([
        { id: "REP-101", owner: "مارون خريش", phone: "03123456", region: "حارة البيادر", type: "سكني", severity: "جسيم", status: "قيد المراجعة", date: "2026-05-28", notes: "تضرر إنشائي." },
        { id: "REP-102", owner: "جان طنوس", phone: "70987654", region: "حي عين التحتا", type: "تجاري", severity: "متوسط", status: "معتمد", date: "2026-05-30", notes: "تحطم زجاج." }
      ]);
  }, []);

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
            <input type="text" placeholder="اسم المستخدم" className="w-full p-3 border rounded-xl text-sm" onChange={e => setLoginForm({...loginForm, username: e.target.value})} required/>
            <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl text-sm" onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
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
        <h2 className="text-xl font-bold mb-4">لوحة التحكم</h2>
        {currentTab === 'dashboard' ? (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="p-4 border rounded-xl">{r.owner} - {r.status}</div>
            ))}
          </div>
        ) : (
          <p>شاشة الاستمارة (يتم تحميلها...)</p>
        )}
      </div>
    </div>
  );
}
```

### لماذا هذا الكود سيحل المشكلة؟
1. **حماية الـ `try-catch`:** إذا فشل Firebase في الاتصال، لن ينهار التطبيق، بل سيستمر في العمل (Fallback).
2. **التبسيط:** هذا الكود هو أبسط نسخة ممكنة من التطبيق.
3. **التأكد من التوافق:** استخدمت `React` و `firebase` بشكل قياسي.

**بعد لصق هذا الكود:**
* انتظر حتى يبني Vercel المشروع (يتحول للون الأخضر).
* إذا ظهر التطبيق بنجاح، فهذا يعني أن التطبيق السابق كان يحتوي على "أخطاء برمجية خفية" في التعامل مع الـ `React State`.
* أخبرني بالنتيجة! إذا ظهرت الصفحة، سنبدأ بإضافة الميزات واحدة تلو الأخرى لضمان عدم حدوث أي خطأ مجدداً.
