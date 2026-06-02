import React, { useState } from 'react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // دالة تسجيل الدخول
  const handleLogin = (e) => {
    e.preventDefault();
    const u = e.target.username.value;
    const p = e.target.password.value;
    if (u === 'admin' && p === '123') setCurrentUser({ name: 'المدير العام', role: 'Admin' });
    else if (u === 'eng' && p === '123') setCurrentUser({ name: 'المهندس الميداني', role: 'Field_Engineer' });
    else alert('بيانات الدخول غير صحيحة');
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#064e3b' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '300px' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '1rem' }}>سند - بلدية عين إبل</h2>
          <input name="username" placeholder="اسم المستخدم" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginBottom: '10px' }} required />
          <input name="password" type="password" placeholder="كلمة المرور" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginBottom: '20px' }} required />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#065f46', color: 'white', fontWeight: 'bold', borderRadius: '8px' }}>دخول</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>مرحباً {currentUser.name}</h1>
        <button onClick={() => setCurrentUser(null)} style={{ color: 'red', fontSize: '0.8rem' }}>خروج</button>
      </div>
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }}>
        {currentUser.role === 'Admin' ? 'لوحة تحكم المدير العام - إدارة المهندسين والتقارير' : 'استمارة المسح الميداني لعين إبل'}
      </div>
    </div>
  );
}
```

#### 2. ملف `vercel.json` (لحل مشكلة البناء - ضعه في المجلد الرئيسي Root):

```json:vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### كيف تتأكد أن التطبيق يعمل؟
1. بعد تحديث هذه الملفات في GitHub، اذهب إلى موقع **Vercel**.
2. ستجد مشروعك يقوم بعملية الـ **Deployment** (أيقونة البناء الدوارة).
3. **إذا ظهرت علامة الصح الخضراء**، اضغط على الرابط المرفق، وسيعمل التطبيق فوراً.
4. **إذا ظهرت علامة الخطأ الحمراء (Build Failed):**
   * اضغط عليها لتفتح السجلات (Logs).
   * **قم بنسخ آخر 5-10 أسطر باللون الأحمر** وأرسلها لي هنا.

أنا أنتظر رسالتك بالنتيجة، وسأقوم بتعديل أي سطر يسبب هذا الخطأ فوراً بناءً على ما ستنسخه لي. لن نستسلم!
