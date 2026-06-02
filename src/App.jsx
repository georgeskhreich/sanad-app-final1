import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';

// ⚠️ هام جداً: استبدل هذه القيم بالقيم الخاصة بك التي استخرجتها من لوحة تحكم Firebase ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyCsrsXxn0ugZos5lxYcPSAr3SJYRMibXnQ",
  authDomain: "ain-ebel-sanad-2df2e.firebaseapp.com",
  projectId: "ain-ebel-sanad-2df2e",
  storageBucket: "ain-ebel-sanad-2df2e.firebasestorage.app",
  messagingSenderId: "827000709964",
  appId: "1:827000709964:web:803f3f03bbc455cdfb65e9",
  measurementId: "G-CSK449Y71Z"
};

// تهيئة خدمات Firebase بشكل آمن لمنع تعطل البناء
let app;
let auth;
let db;

try {
  if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

const appId = 'sanad-ain-ebel-v2'; // معرّف التطبيق لبلدية عين إبل

const DAMAGE_TYPES = [
  "سليم",
  "شروخ وتكسر جزئي بالخشب/الزجاج",
  "اختراق شظايا وثقوب عصف",
  "تلوث شديد وتلف الأنسجة (غبار/رماد/رطوبة)",
  "حروق وتفحم جزئي/كلي",
  "تحطم كلي وانضغاط تحت الأنقاض"
];

const ROOM_DAMAGE_OPTIONS = [
  "سليم - لا توجد غرف مدمرة",
  "تصدع إنشائي شديد بالجدران والأسقف (غير آمن)",
  "انهيار وتدمير الجدران الجانبية للغرفة بالكامل",
  "سقوط وانهيار سقف الغرفة بالكامل",
  "حريق وتفحم كامل الغرفة ومحتوياتها",
  "تدمير كلي وتحول الغرفة إلى ركام"
];

const ROOM_TYPES = [
  "غرفة نوم رئيسية",
  "غرفة نوم فرعية / أطفال",
  "غرفة جلوس / صالون",
  "مطبخ كامل",
  "حمام مستقل",
  "موزع وممر داخلي",
  "كامل غرف المنزل بالكامل"
];

const SEED_SURVEYS = [
  {
    ownerName: "مارون خريش",
    ownerPhone: "03123456",
    ownerId: "283/عين إبل",
    propertyType: "منزل مستقل",
    gps: { lat: 33.1102, lng: 35.4025, address: "عين إبل، حارة البيادر - بجانب كنيسة السيدة العذراء", locationUrl: "https://maps.app.goo.gl/K8f9X4zY7w2R1Q8p7" },
    timestamp: "2026-05-28 10:15",
    engineerName: "م. بيار خريش",
    structural: { columns: "انقشاع الخرسانة (Spalling)", beams: "ترخيم ملحوظ (Deflection)", foundations: "سليم", destroyed_rooms_count: 2, destroyed_rooms_list: [{ type: "غرفة نوم رئيسية", damage: "انهيار وتدمير الجدران الجانبية للغرفة بالكامل" }, { type: "مطبخ كامل", damage: "حريق وتفحم كامل الغرفة ومحتوياتها" }] },
    nonStructural: { walls: "انهيار جزئي", windows_alu_small: 4, windows_alu_large: 2, windows_steel: 2, windows_facade: 1, doors_wood: 3, doors_iron: 1 },
    bathrooms: { status: "تدمير جزئي (أطقم صحية/مغاسل)", count: 2 },
    external: { fences: "أضرار سطحية وشظايا", gates: "متضررة جزئياً", annexes_detailed: { garage: { selected: true, area: 30, damage: "تصدع وشروخ عميقة" }, workroom: { selected: false, area: 0, damage: "سليم" }, attic: { selected: false, area: 0, damage: "سليم" }, canopy: { selected: false, area: 0, damage: "سليم" } } },
    contents: { furniture_bedroom_count: 2, furniture_bedroom_damage: "شروخ وتكسر جزئي بالخشب/الزجاج", furniture_beds_count: 4, furniture_beds_damage: "شروخ وتكسر جزئي بالخشب/الزجاج", furniture_wardrobes_count: 2, furniture_wardrobes_damage: "شروخ وتكسر جزئي بالخشب/الزجاج", furniture_sofa_count: 1, furniture_sofa_damage: "تلوث شديد وتلف الأنسجة (غبار/رماد/رطوبة)", furniture_dining_count: 1, furniture_dining_damage: "سليم", furniture_carpet_count: 5, furniture_carpet_damage: "تلوث شديد وتلف الأنسجة (غبار/رماد/رطوبة)", appliances_fridge: 1, appliances_tv: 2, appliances_cooker: 1, appliances_heater: 1, appliances_ac: 2, appliances_washing: 1 },
    notes: "تضرر إنشائي جسيم بالأعمدة الطابقية وتصدع السقف بفعل العصف القريب محيط كنيسة السيدة العذراء. تدمير المطبخ بالكامل جراء قذيفة مباشرة.",
    severity: "جسيم / خطر",
    status: "بانتظار الاعتماد",
    signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    photos: ["https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600"]
  }
];

const SEED_USERS = [
  { name: "رئيس البلدية (المدير العام)", username: "admin", password: "123", role: "Admin", createdAt: "2026-05-28" },
  { name: "عضو اللجنة (المشرف الفني)", username: "supervisor", password: "123", role: "Supervisor", createdAt: "2026-05-28" },
  { name: "م. بيار خريش", username: "engineer", password: "123", role: "Field_Engineer", createdAt: "2026-05-28" }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [isOnline, setIsOnline] = useState(true);
  const [currentTab, setCurrentTab] = useState("field-new"); 

  const [surveys, setSurveys] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [newEngineerForm, setNewEngineerForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "Field_Engineer"
  });

  const [editingUser, setEditingUser] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerPhone: "",
    ownerId: "",
    propertyType: "منزل مستقل",
    gps: { lat: 33.1102, lng: 35.4025, address: "عين إبل، جاري تحديد الموقع الميداني..." },
    locationUrl: "", 
    
    structural_columns: "سليم",
    structural_beams: "سليم",
    structural_foundations: "سليم",
    
    // حقول الغرف المدمرة المستحدثة ديناميكياً
    structural_destroyed_rooms_count: 0,
    structural_destroyed_rooms_list: [], 
    
    nonStructural_walls: "سليم",
    nonStructural_windows_alu_small: 0,
    nonStructural_windows_alu_large: 0,
    nonStructural_windows_steel: 0,
    nonStructural_windows_facade: 0,
    nonStructural_doors_wood: 0,
    nonStructural_doors_iron: 0,
    
    bathroom_status: "سليم",
    bathroom_count: 0,
    
    external_fences: "سليمة",
    external_gates: "سليمة",
    
    external_annex_garage_selected: false,
    external_annex_garage_area: 0,
    external_annex_garage_damage: "سليم",
    external_annex_workroom_selected: false,
    external_annex_workroom_area: 0,
    external_annex_workroom_damage: "سليم",
    external_annex_attic_selected: false,
    external_annex_attic_area: 0,
    external_annex_attic_damage: "سليم",
    external_annex_canopy_selected: false,
    external_annex_canopy_area: 0,
    external_annex_canopy_damage: "سليم",
    
    furniture_bedroom_count: 0,
    furniture_bedroom_damage: "سليم",
    furniture_beds_count: 0,
    furniture_beds_damage: "سليم",
    furniture_wardrobes_count: 0,
    furniture_wardrobes_damage: "سليم",
    furniture_sofa_count: 0,
    furniture_sofa_damage: "سليم",
    furniture_dining_count: 0,
    furniture_dining_damage: "سليم",
    furniture_carpet_count: 0,
    furniture_carpet_damage: "سليم",
    
    appliances_fridge: 0,
    appliances_tv: 0,
    appliances_cooker: 0,
    appliances_heater: 0,
    appliances_ac: 0,
    appliances_washing: 0,
    
    notes: "",
    audioNote: null,
    photos: []
  });

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("الكل");
  const [toastMessage, setToastMessage] = useState("");

  const [showPasswords, setShowPasswords] = useState({});

  const ANNEX_TYPES = [
    { id: "garage", label: "كراج سيارات خارجي مستقل", icon: "🚗" },
    { id: "workroom", label: "غرفة عمل أو حراسة خارجية", icon: "🛠️" },
    { id: "attic", label: "سقيفة أو مخزن علوي خارجي", icon: "📦" },
    { id: "canopy", label: "مظلة قرميد خارجية أو برجولة", icon: "🏡" }
  ];

  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(err => console.error("Firebase Anonymous Auth failed:", err));
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) return;

    const surveysColRef = collection(db, 'artifacts', appId, 'public', 'data', 'surveys');
    const unsubscribeSurveys = onSnapshot(surveysColRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSurveys(list);
    });

    const usersColRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(list);
    });

    return () => {
      unsubscribeSurveys();
      unsubscribeUsers();
    };
  }, [firebaseUser]);

  const handleDestroyedRoomsCountChange = (countVal) => {
    const count = Math.max(0, parseInt(countVal) || 0);
    setFormData(prev => {
      const list = [...prev.structural_destroyed_rooms_list];
      if (count > list.length) {
        for (let i = list.length; i < count; i++) {
          list.push({ type: ROOM_TYPES[0], damage: ROOM_DAMAGE_OPTIONS[1] });
        }
      } else if (count < list.length) {
        list.splice(count);
      }
      return {
        ...prev,
        structural_destroyed_rooms_count: count,
        structural_destroyed_rooms_list: list
      };
    });
  };

  const handleRoomDetailChange = (index, field, value) => {
    setFormData(prev => {
      const list = [...prev.structural_destroyed_rooms_list];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, structural_destroyed_rooms_list: list };
    });
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSeedDatabase = async () => {
    if (!firebaseUser || !db) {
      showToast("يرجى إعداد مفاتيح Firebase أولاً لربط قاعدة البيانات الحية.");
      return;
    }
    try {
      showToast("جاري تهيئة قاعدة البيانات السحابية لبلدية عين إبل...");
      for (const item of SEED_SURVEYS) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'surveys'), item);
      }
      for (const user of SEED_USERS) {
        if (!usersList.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), user);
        }
      }
      showToast("تم تفعيل البيانات السحابية وحسابات المهندسين بنجاح!");
    } catch (e) {
      console.error(e);
      showToast("خطأ بالاتصال. تأكد من تفعيل قاعدة البيانات.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = loginForm;
    const matchingUser = usersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);

    if (matchingUser) {
      setCurrentUser({ username: matchingUser.username, role: matchingUser.role, name: matchingUser.name });
      setCurrentTab(matchingUser.role === "Supervisor" ? "supervisor-dashboard" : "field-new");
      setAuthError("");
      showToast(`مرحباً ${matchingUser.name} تم تسجيل الدخول السحابي بنجاح.`);
    } else if (username.toLowerCase() === "admin" && password === "123") {
      setCurrentUser({ username: "admin", role: "Admin", name: "رئيس بلدية عين إبل (الأدمن)" });
      setCurrentTab("supervisor-dashboard");
      setAuthError("");
    } else {
      setAuthError("اسم المستخدم أو كلمة المرور غير صحيحة!");
    }
  };

  const handleQuickSwitch = (roleUsername) => {
    if (roleUsername === 'admin') {
      setCurrentUser({ username: "admin", role: "Admin", name: "رئيس بلدية عين إبل (الأدمن)" });
      setCurrentTab("supervisor-dashboard");
    } else {
      const found = usersList.find(u => u.username === roleUsername);
      if (found) {
        setCurrentUser({ username: found.username, role: found.role, name: found.name });
        setCurrentTab(found.role === "Supervisor" ? "supervisor-dashboard" : "field-new");
      } else {
        showToast("اضغط على زر تهيئة استمارات عين إبل أولاً لتفعيل حسابات الطوارئ السريعة.");
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: "", password: "" });
  };

  const handleCapturePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photos: [...prev.photos, event.target.result] }));
      };
      reader.readAsDataURL(file);
    });
    showToast("تم التقاط وإرفاق الصورة بنجاح.");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(chunks, { type: 'audio/webm' }));
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, audioNote: reader.result }));
          showToast("تم حفظ التسجيل الصوتي.");
        };
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      showToast("تعذر الوصول للمايكروفون.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const calculateSeverity = (data) => {
    const isRed = 
      data.structural_columns === "تصدعات عميقة" || data.structural_columns === "انقشاع الخرسانة (Spalling)" || data.structural_columns === "انبعاج حديد التسليح (Buckling)" || data.structural_columns === "فشل كلي/انهيار" ||
      data.structural_beams === "ترخيم ملحوظ (Deflection)" || data.structural_beams === "انفصال الغطاء الخرساني" || data.structural_beams === "انهيار جزئي/كلي" ||
      data.structural_foundations === "هبوط تفاضلي (Settlement)" || data.bathroom_status === "تدمير كلي وتفجر التمديدات الصحية" ||
      data.structural_destroyed_rooms_count > 0;
    if (isRed) return "جسيم / خطر";
    if (data.nonStructural_walls !== "سليم") return "متوسط";
    return "خفيف";
  };

  const handleFormSubmit = async () => {
    let signatureImg = "";
    if (canvasRef.current && hasSignature) signatureImg = canvasRef.current.toDataURL();

    const calculatedSev = calculateSeverity(formData);
    const newSurveyPayload = {
      engineerName: currentUser.name,
      ownerName: formData.ownerName || "غير محدد",
      ownerPhone: formData.ownerPhone || "غير معروف",
      ownerId: formData.ownerId || "غير مدخل",
      propertyType: formData.propertyType,
      gps: { lat: formData.gps.lat, lng: formData.gps.lng, address: formData.gps.address, locationUrl: formData.locationUrl || "" },
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      structural: {
        columns: formData.structural_columns,
        beams: formData.structural_beams,
        foundations: formData.structural_foundations,
        destroyed_rooms_count: formData.structural_destroyed_rooms_count,
        destroyed_rooms_list: formData.structural_destroyed_rooms_list
      },
      nonStructural: {
        walls: formData.nonStructural_walls,
        windows_alu_small: parseInt(formData.nonStructural_windows_alu_small) || 0,
        windows_alu_large: parseInt(formData.nonStructural_windows_alu_large) || 0,
        windows_steel: parseInt(formData.nonStructural_windows_steel) || 0,
        windows_facade: parseInt(formData.nonStructural_windows_facade) || 0,
        doors_wood: parseInt(formData.nonStructural_doors_wood) || 0,
        doors_iron: parseInt(formData.nonStructural_doors_iron) || 0
      },
      bathrooms: { status: formData.bathroom_status, count: parseInt(formData.bathroom_count) || 0 },
      external: {
        fences: formData.external_fences,
        gates: formData.external_gates,
        annexes_detailed: {
          garage: { selected: formData.external_annex_garage_selected, area: parseInt(formData.external_annex_garage_area) || 0, damage: formData.external_annex_garage_damage },
          workroom: { selected: formData.external_annex_workroom_selected, area: parseInt(formData.external_annex_workroom_area) || 0, damage: formData.external_annex_workroom_damage },
          attic: { selected: formData.external_annex_attic_selected, area: parseInt(formData.external_annex_attic_area) || 0, damage: formData.external_annex_attic_damage },
          canopy: { selected: formData.external_annex_canopy_selected, area: parseInt(formData.external_annex_canopy_area) || 0, damage: formData.external_annex_canopy_damage }
        }
      },
      contents: {
        furniture_bedroom_count: parseInt(formData.furniture_bedroom_count) || 0,
        furniture_bedroom_damage: formData.furniture_bedroom_damage,
        furniture_beds_count: parseInt(formData.furniture_beds_count) || 0,
        furniture_beds_damage: formData.furniture_beds_damage,
        furniture_wardrobes_count: parseInt(formData.furniture_wardrobes_count) || 0,
        furniture_wardrobes_damage: formData.furniture_wardrobes_damage,
        furniture_sofa_count: parseInt(formData.furniture_sofa_count) || 0,
        furniture_sofa_damage: formData.furniture_sofa_damage,
        furniture_dining_count: parseInt(formData.furniture_dining_count) || 0,
        furniture_dining_damage: formData.furniture_dining_damage,
        furniture_carpet_count: parseInt(formData.furniture_carpet_count) || 0,
        furniture_carpet_damage: formData.furniture_carpet_damage,
        appliances_fridge: parseInt(formData.appliances_fridge) || 0,
        appliances_tv: parseInt(formData.appliances_tv) || 0,
        appliances_cooker: parseInt(formData.appliances_cooker) || 0,
        appliances_heater: parseInt(formData.appliances_heater) || 0,
        appliances_ac: parseInt(formData.appliances_ac) || 0,
        appliances_washing: parseInt(formData.appliances_washing) || 0
      },
      notes: formData.notes,
      audioNote: formData.audioNote,
      severity: calculatedSev,
      status: isOnline && db ? "بانتظار الاعتماد" : "مسودة (أوفلاين)",
      signature: signatureImg || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      photos: formData.photos.length > 0 ? formData.photos : ["https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600"]
    };

    try {
      if (isOnline && db) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'surveys'), newSurveyPayload);
        showToast("تم رفع الملف السحابي لعين إبل أونلاين بنجاح!");
      } else {
        setDrafts([{ id: `DRAFT-${Date.now()}`, ...newSurveyPayload }, ...drafts]);
        showToast("تم حفظ التقرير كمسودة في الهاتف.");
      }
    } catch (e) {
      showToast("خطأ سحابي في كتابة البيانات.");
    }

    setWizardStep(1);
    setHasSignature(false);
    setFormData(prev => ({
      ...prev,
      ownerName: "", ownerPhone: "", ownerId: "", locationUrl: "", notes: "", audioNote: null, photos: [],
      structural_destroyed_rooms_count: 0, structural_destroyed_rooms_list: []
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    if (!db) return;
    const { name, username, password, role } = newEngineerForm;
    if (usersList.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      showToast("اسم المستخدم مسجل سابقاً!");
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), {
        name, username: username.toLowerCase().trim(), password, role, createdAt: new Date().toISOString().substring(0, 10)
      });
      showToast(`تم إنشاء حساب ${role === "Supervisor" ? "مشرف" : "مهندس"} بنجاح.`);
      setNewEngineerForm({ name: "", username: "", password: "", role: "Field_Engineer" });
    } catch (err) {
      showToast("فشل إنشاء الحساب.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!db || !editingUser) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', editingUser.id), { password: editingUser.newPassword });
      showToast(`تم تغيير كلمة المرور للمستخدم (${editingUser.name}) بنجاح!`); // Backticks fixed!
      setEditingUser(null);
    } catch (err) {
      showToast("خطأ سحابي في التعديل.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id));
      showToast("تم حظر وحذف الموظف بنجاح.");
    } catch (e) {
      showToast("خطأ سحابي في الحذف.");
    }
  };

  const handleDeleteSurvey = async (id) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'surveys', id));
      setSelectedSurvey(null);
      showToast("تم حذف الاستمارة نهائياً من قاعدة البيانات.");
    } catch (e) {
      showToast("خطأ سحابي في الحذف.");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'surveys', id), { status });
      if (selectedSurvey && selectedSurvey.id === id) {
        setSelectedSurvey(prev => ({ ...prev, status }));
      }
      showToast(`تم تعديل قرار اللجنة إلى: ${status}`); // Backticks fixed!
    } catch (e) {
      showToast("فشل تحديث الحالة.");
    }
  };

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "الكل" || s.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleSyncDrafts = async () => {
    if (!db || drafts.length === 0) return;
    try {
      const surveysColRef = collection(db, 'artifacts', appId, 'public', 'data', 'surveys');
      for (const d of drafts) {
        const { id, ...p } = d;
        p.status = "بانتظار الاعتماد";
        await addDoc(surveysColRef, p);
      }
      setDrafts([]);
      showToast("تمت مزامنة جميع المسودات أونلاين!");
    } catch (error) {
      showToast("فشلت المزامنة السحابية.");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
      {/* البوابة الأساسية ورأس الصفحة */}
      <header className="bg-emerald-950 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-white text-emerald-950 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg">ع</div>
            <div>
              <h1 className="text-sm md:text-base font-bold">بلدية عين إبل <span className="text-xs font-normal text-emerald-300">| نظام سند السحابي</span></h1>
              <p className="text-[10px] text-emerald-200">غرفة عمليات الفحص وحصر الأضرار الفني (جنوب لبنان)</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2 text-xs">
            <button 
              onClick={() => { setIsOnline(!isOnline); showToast(isOnline ? "وضع عدم الاتصال" : "وضع الاتصال السحابي"); }}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center transition-colors ${isOnline ? "bg-emerald-900 border border-emerald-500 text-emerald-200" : "bg-red-900 border border-red-500 text-red-100"}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ml-2 ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`}></span>
              {isOnline ? "أونلاين" : "أوفلاين محلي"}
            </button>

            {currentUser && (
              <div className="bg-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-800 text-emerald-100 flex items-center gap-2">
                <span className="font-bold">{currentUser.name}</span>
                <span className="text-[9px] bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded font-bold">{currentUser.role}</span>
                <button onClick={handleLogout} className="text-red-400 font-bold hover:text-white mr-2">خروج</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* محاكي الأدوار السريع للتجربة المعززة والتدقيق السلس */}
      <div className="bg-emerald-900 text-emerald-100 py-1.5 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="font-bold">لوحة المحاكاة والتدقيق الفوري للأدوار:</span>
          <button onClick={() => handleQuickSwitch('admin')} className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded-lg font-bold">🔑 المدير (Admin)</button>
          <button onClick={() => handleQuickSwitch('supervisor')} className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded-lg font-bold">🔍 المشرف (Supervisor)</button>
          <button onClick={() => handleQuickSwitch('engineer')} className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded-lg font-bold">👷 المهندس (Engineer)</button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {!currentUser ? (
          <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-12 p-6 md:p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-emerald-800">تسجيل الدخول السحابي</h2>
              <p className="text-xs text-slate-500 mt-1">المكتب الفني ولجنة الترميم لبلدية عين إبل</p>
            </div>

            {authError && <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs font-semibold">{authError}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">اسم المستخدم</label>
                <input type="text" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-sm outline-none" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">كلمة المرور</label>
                <input type="password" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-sm outline-none" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition">دخول آمن للمنظومة</button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
            
            <aside className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border flex flex-col space-y-3 h-fit">
              <span className="text-[10px] uppercase font-bold text-slate-400">لوحة الملاحة والعمليات</span>
              
              {(currentUser.role === "Admin" || currentUser.role === "Supervisor") && (
                <button onClick={() => setCurrentTab("supervisor-dashboard")} className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTab === "supervisor-dashboard" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}>لوحة التقارير والمراجعة</button>
              )}
              {currentUser.role === "Admin" && (
                <button onClick={() => setCurrentTab("supervisor-users")} className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTab === "supervisor-users" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}>👤 إدارة حسابات الموظفين</button>
              )}
              {(currentUser.role === "Admin" || currentUser.role === "Field_Engineer") && (
                <button onClick={() => setCurrentTab("field-new")} className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTab === "field-new" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}>استمارة مسح ميداني جديدة</button>
              )}
              {(currentUser.role === "Admin" || currentUser.role === "Field_Engineer") && (
                <button onClick={() => setCurrentTab("field-drafts")} className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTab === "field-drafts" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}>المسودات الميدانية محلياً ({drafts.length})</button>
              )}
            </aside>

            <section className="lg:col-span-9 bg-white rounded-3xl shadow-sm border p-6 flex flex-col min-h-[550px]">
              
              {/* تبويب الاستمارة الميدانية */}
              {currentTab === "field-new" && (
                <div className="space-y-6 text-slate-800">
                  <div className="bg-emerald-50 border-r-4 border-emerald-600 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-emerald-950">تقييم الأضرار الميداني الحصري (خطوة {wizardStep} من 6)</h2>
                      <p className="text-[11px] text-emerald-700">بلدية عين إبل - قضاء بنت جبيل</p>
                    </div>
                  </div>

                  {/* الخطوة 1: المعلومات العامة */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold block text-slate-700">اسم صاحب العقار بالكامل</label>
                          <input type="text" className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-sm" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold block text-slate-700">رقم هاتف للتواصل</label>
                          <input type="tel" className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-sm text-left" value={formData.ownerPhone} onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold block text-slate-700">رقم السجل / قيد العائلة اللبناني</label>
                          <input type="text" className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-sm text-left" value={formData.ownerId} onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold block text-slate-700">نوع العقار</label>
                          <select className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-sm bg-white" value={formData.propertyType} onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}>
                            <option>منزل مستقل</option><option>شقة سكنية</option><option>مبنى تجاري</option><option>مؤسسة عامة</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-slate-700">التوقيع الجغرافي الآلي ورابط جوجل مابس</h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                          <div>خط العرض: {formData.gps.lat}</div><div>خط الطول: {formData.gps.lng}</div>
                        </div>
                        <input type="url" placeholder="الصق رابط موقع جوجل مابس المنسوخ هنا" className="w-full p-2.5 bg-white border text-slate-900 rounded-xl text-xs text-left font-mono" value={formData.locationUrl} onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {/* الخطوة 2: الهيكل الإنشائي والغرف المدمرة ديناميكياً */}
                  {wizardStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold block text-slate-700">أ. الأعمدة والجدران الحاملة</label>
                          <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-xl text-xs bg-white mt-1" value={formData.structural_columns} onChange={(e)=>setFormData({...formData, structural_columns:e.target.value})}>
                            <option>سليم</option><option>تشققات شعرية سطحيّة</option><option>تصدعات عميقة</option><option>انقشاع الخرسانة (Spalling)</option><option>انبعاج حديد التسليح (Buckling)</option><option>فشل كلي/انهيار</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold block text-slate-700">ب. الجسور والأسقف</label>
                          <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-xl text-xs bg-white mt-1" value={formData.structural_beams} onChange={(e)=>setFormData({...formData, structural_beams:e.target.value})}>
                            <option>سليم</option><option>تشققات عرضية/طولية</option><option>ترخيم ملحوظ (Deflection)</option><option>انفصال الغطاء الخرساني</option><option>انهيار جزئي/كلي</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold block text-slate-700">ج. الأساسات</label>
                          <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-xl text-xs bg-white mt-1" value={formData.structural_foundations} onChange={(e)=>setFormData({...formData, structural_foundations:e.target.value})}>
                            <option>سليم</option><option>تصدع في الأساسات</option><option>هبوط تفاضلي (Settlement)</option>
                          </select>
                        </div>
                      </div>

                      {/* حصر وتفصيل الغرف المدمرة ديناميكياً */}
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-4">
                        <h4 className="text-xs font-bold text-red-800">🏚️ حصر وتفصيل الغرف المدمرة بالكامل داخل العقار (ديناميكي)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold block text-slate-700">عدد الغرف المدمرة بالكامل</label>
                            <input 
                              type="number" 
                              min="0"
                              className="w-32 p-2 bg-white border text-slate-900 rounded-xl text-xs mt-1 text-center font-bold"
                              value={formData.structural_destroyed_rooms_count}
                              onChange={(e) => handleDestroyedRoomsCountChange(e.target.value)}
                            />
                          </div>
                        </div>

                        {formData.structural_destroyed_rooms_count > 0 && (
                          <div className="space-y-3 pt-3 border-t border-red-200">
                            {formData.structural_destroyed_rooms_list.map((room, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-red-100 text-xs">
                                <div>
                                  <label className="block font-bold text-slate-700">صنف الغرفة {index + 1}</label>
                                  <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-lg mt-1" value={room.type} onChange={(e)=>handleRoomDetailChange(index, 'type', e.target.value)}>
                                    {ROOM_TYPES.map((t, idx) => <option key={idx}>{t}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-700">نوع ودرجة الخراب</label>
                                  <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-lg mt-1" value={room.damage} onChange={(e)=>handleRoomDetailChange(index, 'damage', e.target.value)}>
                                    {ROOM_DAMAGE_OPTIONS.filter(opt => opt !== "سليم - لا توجد غرف مدمرة").map((opt, idx) => <option key={idx}>{opt}</option>)}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* الخطوة 3: الأعمال المعمارية والشبابيك والأبواب بالتفصيل */}
                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold block text-slate-700">جدران وقواطع الطوب (غير الحاملة)</label>
                        <select className="w-full p-2 bg-slate-50 border text-slate-900 rounded-xl text-xs bg-white mt-1" value={formData.nonStructural_walls} onChange={(e)=>setFormData({...formData, nonStructural_walls:e.target.value})}>
                          <option>سليم</option><option>تشققات عند الفواصل</option><option>تشققات مائلة (X-Cracks)</option><option>انهيار جزئي</option><option>انهيار كامل للجدار</option>
                        </select>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border space-y-4">
                        <h4 className="text-xs font-bold text-slate-700">جرد وتفصيل الشبابيك والنوافذ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {[{k:"nonStructural_windows_alu_small", l:"ألمنيوم صغير"}, {k:"nonStructural_windows_alu_large", l:"ألمنيوم كبير"}, {k:"nonStructural_windows_steel", l:"حديد وحماية"}, {k:"nonStructural_windows_facade", l:"واجهات زجاجية"}].map(item => (
                            <div key={item.k} className="flex justify-between items-center p-2.5 bg-white rounded-lg border">
                              <span className="text-slate-700">{item.l}</span>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button type="button" onClick={()=>setFormData(p=>({...p, [item.k]:Math.max(0, p[item.k]-1)}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black text-xs">-</button>
                                <span className="font-bold w-6 text-center text-slate-900">{formData[item.k]}</span>
                                <button type="button" onClick={()=>setFormData(p=>({...p, [item.k]:p[item.k]+1}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black text-xs">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border space-y-4">
                        <h4 className="text-xs font-bold text-slate-700">جرد وتفصيل الأبواب</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {[{k:"nonStructural_doors_wood", l:"أبواب خشبية داخلية"}, {k:"nonStructural_doors_iron", l:"أبواب حديد خارجية"}].map(item => (
                            <div key={item.k} className="flex justify-between items-center p-2.5 bg-white rounded-lg border">
                              <span className="text-slate-700">{item.l}</span>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button type="button" onClick={()=>setFormData(p=>({...p, [item.k]:Math.max(0, p[item.k]-1)}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black text-xs">-</button>
                                <span className="font-bold w-6 text-center text-slate-900">{formData[item.k]}</span>
                                <button type="button" onClick={()=>setFormData(p=>({...p, [item.k]:p[item.k]+1}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black text-xs">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* الخطوة 4: الحمامات والملاحق والأسوار */}
                  {wizardStep === 4 && (
                    <div className="space-y-6 text-slate-800">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                        <h4 className="text-xs font-bold text-emerald-800">🚿 بند مستقل: تقييم أضرار وتعداد الحمامات والشبكة الصحية</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border text-xs">
                            <span className="text-slate-700">تعداد الحمامات المتضررة:</span>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button type="button" onClick={()=>setFormData(p=>({...p, bathroom_count:Math.max(0, p.bathroom_count-1)}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded">-</button>
                              <span className="font-bold w-6 text-center text-slate-900">{formData.bathroom_count}</span>
                              <button type="button" onClick={()=>setFormData(p=>({...p, bathroom_count:p.bathroom_count+1}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded">+</button>
                            </div>
                          </div>
                          <select className="w-full p-2.5 bg-white border text-slate-900 rounded-xl text-xs outline-none" value={formData.bathroom_status} onChange={(e)=>setFormData({...formData, bathroom_status:e.target.value})}>
                            <option>سليم</option><option>تضرر سطحي (سيراميك/إكسسوارات)</option><option>تدمير جزئي (أطقم صحية/مغاسل)</option><option>تدمير كلي وتفجر التمديدات الصحية</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border space-y-3 font-sans">
                        <h4 className="text-xs font-bold text-slate-700">🏡 جرد وتفصيل الملاحق الخارجية (المساحة + الخراب)</h4>
                        {ANNEX_TYPES.map(item => {
                          const isSel = formData[`external_annex_${item.id}_selected`];
                          return (
                            <div key={item.id} className="p-3 bg-white rounded-lg border">
                              <label className="flex items-center text-xs font-bold text-slate-800 cursor-pointer">
                                <input type="checkbox" className="ml-2 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" checked={isSel} onChange={(e)=>setFormData({...formData, [`external_annex_${item.id}_selected`]:e.target.checked})} />
                                <span>{item.icon} {item.label}</span>
                              </label>
                              {isSel && (
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-[10px] text-slate-900">
                                  <input type="number" placeholder="المساحة م²" className="p-1.5 border text-slate-900 rounded-lg outline-none focus:border-emerald-600 bg-slate-50 font-bold" value={formData[`external_annex_${item.id}_area`]||""} onChange={(e)=>setFormData({...formData, [`external_annex_${item.id}_area`]:parseInt(e.target.value)||0})} />
                                  <select className="p-1.5 border text-slate-900 rounded-lg bg-slate-50 font-bold outline-none" value={formData[`external_annex_${item.id}_damage`]} onChange={(e)=>setFormData({...formData, [`external_annex_${item.id}_damage`]:e.target.value})}>
                                    <option>سليم</option><option>تصدع عميق</option><option>انهيار جزئي</option><option>انهيار كلي</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <label className="text-xs font-bold block text-slate-700">الأسوار الخارجية للمنزل والحديقة</label>
                        <select className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-xs bg-white mt-1" value={formData.external_fences} onChange={(e)=>setFormData({...formData, external_fences:e.target.value})}>
                          <option>سليمة</option><option>أضرار سطحية وشظايا</option><option>تصدع وشروخ خطيرة</option><option>انهيار جزئي</option><option>انهيار كلي</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* الخطوة 5: الأثاث والأجهزة بالتعداد ونوع الخراب */}
                  {wizardStep === 5 && (
                    <div className="space-y-6 text-slate-800">
                      <div className="bg-slate-50 p-4 rounded-xl border space-y-4">
                        <h4 className="text-xs font-bold text-slate-700">🛋️ جرد وتفصيل الأثاث والمحتويات (العدد ونوع الخراب للتعويض)</h4>
                        {[
                          {k: "bedroom", l: "غرف نوم كاملة"},
                          {k: "beds", l: "أسرة منفردة"},
                          {k: "wardrobes", l: "خزائن ملابس مستقلة"},
                          {k: "sofa", l: "صالونات وأطقم كنب"},
                          {k: "dining", l: "طاولات سفرة"},
                          {k: "carpet", l: "سجاد وموكيت"}
                        ].map(item => (
                          <div key={item.k} className="bg-white p-3 rounded-lg border flex flex-col md:flex-row justify-between gap-3 text-xs items-center">
                            <span className="font-bold md:w-1/3 text-slate-800">{item.l}</span>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button type="button" onClick={()=>setFormData(p=>({...p, [`furniture_${item.k}_count`]:Math.max(0, p[`furniture_${item.k}_count`]-1)}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black">-</button>
                              <span className="font-bold w-6 text-center text-slate-950">{formData[`furniture_${item.k}_count`]}</span>
                              <button type="button" onClick={()=>setFormData(p=>({...p, [`furniture_${item.k}_count`]:p[`furniture_${item.k}_count`]+1}))} className="w-8 h-8 bg-slate-100 text-slate-900 rounded font-black">+</button>
                            </div>
                            <select className="p-1.5 border text-slate-900 rounded-lg bg-slate-50 text-[10px] outline-none" value={formData[`furniture_${item.k}_damage`]} onChange={(e)=>setFormData({...formData, [`furniture_${item.key}_damage`]:e.target.value})}>
                              {DAMAGE_TYPES.map((dmg, i) => <option key={i} value={dmg}>{dmg}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border space-y-4 font-sans">
                        <h4 className="text-xs font-bold text-slate-700">🏢 جرد الأجهزة الكهربائية (تعداد تالف)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          {[{k:"fridge", l:"براد / ثلاجة"}, {k:"tv", l:"شاشة تلفزيون"}, {k:"cooker", l:"فرن طهي / غاز"}, {k:"heater", l:"مدفأة / صوبة"}, {k:"ac", l:"مكيف هواء"}, {k:"washing", l:"غسالة ملابس"}].map(item => (
                            <div key={item.k} className="bg-white p-2.5 rounded-lg border flex justify-between items-center">
                              <span className="text-slate-700">{item.l}</span>
                              <div className="flex items-center space-x-1.5 space-x-reverse">
                                <button type="button" onClick={()=>setFormData(p=>({...p, [`appliances_${item.k}`]:Math.max(0, p[`appliances_${item.k}`]-1)}))} className="w-6 h-6 bg-slate-100 text-slate-900 rounded font-black text-xs">-</button>
                                <span className="font-bold w-4 text-center text-[10px] text-slate-900">{formData[`appliances_${item.k}`]}</span>
                                <button type="button" onClick={()=>setFormData(p=>({...p, [`appliances_${item.k}`]:p[`appliances_${item.k}`]+1}))} className="w-6 h-6 bg-slate-100 text-slate-900 rounded font-black text-xs">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* الخطوة 6: التوثيق البصري والصوت والتوقيع الرقمي */}
                  {wizardStep === 6 && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-slate-700">📷 التوثيق المصور المباشر (كاميرا الهاتف)</h4>
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                        <button type="button" onClick={handleCapturePhoto} className="bg-emerald-950 text-white px-4 py-2.5 rounded-xl text-xs font-bold">📷 تشغيل الكاميرا والتقاط صورة</button>
                        
                        {formData.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {formData.photos.map((p, idx) => <img key={idx} src={p} className="rounded-lg aspect-video object-cover border" alt="captured site" />)}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border space-y-3 text-slate-800">
                        <h4 className="text-xs font-bold text-slate-700">🎙️ الملاحظات الفنية والافادات الصوتية الفورية</h4>
                        <textarea className="w-full p-2.5 bg-white border text-slate-900 rounded-xl text-xs h-20 outline-none focus:border-emerald-600" placeholder="ملاحظات وتوصيات اللجنة الفنية لبلدية عين إبل..." value={formData.notes} onChange={(e)=>setFormData({...formData, notes:e.target.value})} />
                        
                        <div className="pt-2 border-t flex items-center gap-2">
                          {!formData.audioNote ? (
                            <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isRecording ? "bg-red-100 text-red-700 animate-pulse border border-red-300" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>
                              {isRecording ? "جاري التسجيل... اضغط لحفظ الصوت" : "🎙️ تسجيل ملاحظة صوتية مباشرة للمالك"}
                            </button>
                          ) : (
                            <div className="flex items-center w-full bg-white p-2 rounded-xl border gap-2">
                              <span className="text-xs font-bold text-emerald-800">🎧 الإفادة الصوتية:</span>
                              <audio src={formData.audioNote} controls className="h-6 w-full max-w-[150px]" />
                              <button type="button" onClick={() => setFormData(prev => ({ ...prev, audioNote: null }))} className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-bold mr-auto">حذف</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-700 block">✍️ توقيع المهندس الفاحص رقمياً</label><button type="button" onClick={clearCanvas} className="text-[10px] text-red-600 font-bold">إعادة</button></div>
                        <canvas ref={canvasRef} width={400} height={150} className="w-full bg-slate-50 border rounded-xl h-32 touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                      </div>
                    </div>
                  )}

                  {/* شريط الملاحة للخطوات */}
                  <div className="bg-slate-50 p-4 border-t rounded-b-3xl flex justify-between items-center">
                    <button type="button" disabled={wizardStep === 1} onClick={()=>setWizardStep(wizardStep-1)} className={`px-4 py-2 rounded-xl font-bold text-xs ${wizardStep === 1 ? "text-slate-300" : "bg-slate-200 text-slate-700"}`}>السابق</button>
                    <span className="text-xs font-bold text-slate-500">خطوة {wizardStep} من 6</span>
                    {wizardStep < 6 ? (
                      <button type="button" onClick={()=>setWizardStep(wizardStep+1)} className="bg-emerald-950 text-white px-5 py-2 rounded-xl text-xs font-bold">التالي</button>
                    ) : (
                      <button type="button" onClick={handleFormSubmit} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md">حفظ وإرسال التقرير للمنزل التالي</button>
                    )}
                  </div>
                </div>
              )}

              {/* تبويب المسودات في الميدان */}
              {currentTab === "field-drafts" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-sm font-bold text-slate-800">المسودات الميدانية المسجلة محلياً (أوفلاين)</h2>
                    {drafts.length > 0 && <button onClick={handleSyncDrafts} disabled={!isOnline} className="bg-amber-500 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold">مزامنة أونلاين</button>}
                  </div>
                  {drafts.length === 0 ? (
                    <p className="text-center text-slate-400 py-12 text-xs">لا توجد أي مسودات معلقة بالهاتف حالياً.</p>
                  ) : (
                    <div className="space-y-2">
                      {drafts.map((d, i) => (
                        <div key={i} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                          <div><span className="text-[10px] font-mono text-slate-400">{d.timestamp}</span><h4 className="font-bold text-slate-800">{d.ownerName}</h4></div>
                          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded font-bold text-[10px]">مسودة معلقة</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* لوحة تحكم المشرف والبلدية (Supervisor Dashboard) */}
              {currentTab === "supervisor-dashboard" && (
                <div className="space-y-6">
                  <div className="bg-emerald-950 text-white p-6 rounded-2xl">
                    <h2 className="text-base font-bold">لجنة مسح وإعمار عين إبل - لوحة المراقبة الفنية</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
                      <div className="bg-emerald-900 p-3 rounded-xl border border-emerald-800"><span className="text-[10px] text-emerald-200">الاستمارات الكلية</span><h3 className="text-xl font-bold mt-1">{totalReportsCount}</h3></div>
                      <div className="bg-emerald-900 p-3 rounded-xl border border-emerald-800"><span className="text-[10px] text-amber-300">بانتظار الاعتماد</span><h3 className="text-xl font-bold mt-1 text-amber-400">{pendingCount}</h3></div>
                      <div className="bg-emerald-900 p-3 rounded-xl border border-emerald-800"><span className="text-[10px] text-red-300">خطر إنشائي جسيم</span><h3 className="text-xl font-bold mt-1 text-red-400">{redSeverityCount}</h3></div>
                      <div className="bg-emerald-900 p-3 rounded-xl border border-emerald-800"><span className="text-[10px] text-emerald-200">نسبة الاعتماد</span><h3 className="text-xl font-bold mt-1">{totalReportsCount > 0 ? `${Math.round((approvedCount/totalReportsCount)*100)}%` : "0%"}</h3></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-slate-800">
                    <div className="xl:col-span-5 space-y-4">
                      <input type="text" placeholder="ابحث باسم المالك أو رقم المعاينة..." className="w-full p-2.5 bg-slate-50 border text-slate-900 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
                      <div className="flex gap-1.5 flex-wrap text-[10px] font-bold">
                        {["الكل", "جسيم / خطر", "متوسط", "خفيف"].map(f => (
                          <button key={f} onClick={()=>setSeverityFilter(f)} className={`px-2.5 py-1.5 rounded-lg transition-colors ${severityFilter === f ? "bg-emerald-950 text-white" : "bg-slate-100 text-slate-500"}`}>{f}</button>
                        ))}
                      </div>
                      
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 text-xs">
                        {filteredSurveys.map(s => (
                          <div key={s.id} onClick={()=>setSelectedSurvey(s)} className={`p-3 border rounded-xl cursor-pointer ${selectedSurvey?.id === s.id ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                            <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-slate-400">{s.id.substring(0,8)}</span><span className={`text-[9px] px-2 py-0.5 rounded font-bold ${s.severity === "جسيم / خطر" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{s.severity}</span></div>
                            <h4 className="font-bold mt-1 text-slate-855">{s.ownerName}</h4>
                            <div className="flex justify-between mt-2 pt-2 border-t text-[10px] text-slate-400"><span>م. {s.engineerName}</span><strong>{s.status}</strong></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="xl:col-span-7 bg-slate-50 p-5 rounded-2xl border">
                      {selectedSurvey ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-white p-3 rounded-xl border text-xs">
                            <span className="font-bold text-slate-700">حالة الاعتماد: {selectedSurvey.status}</span>
                            <div className="flex space-x-1.5 space-x-reverse">
                              <button onClick={()=>handleUpdateStatus(selectedSurvey.id, "معتمد")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">اعتماد</button>
                              <button onClick={()=>handleUpdateStatus(selectedSurvey.id, "مرفوض")} className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-[10px] font-bold">رفض</button>
                              {currentUser.role === "Admin" && (
                                <button onClick={()=>handleDeleteSurvey(selectedSurvey.id)} className="bg-slate-900 text-white px-2.5 py-1 rounded text-[10px] font-bold mr-2">حذف التقرير 🗑️</button>
                              )}
                            </div>
                          </div>

                          <div id="printable-report" className="bg-white p-6 rounded-2xl shadow border space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b-2 border-emerald-950 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-950 rounded-xl flex items-center justify-center font-bold text-xs text-center leading-none">بلدية<br/>عين إبل</div>
                                <div><h3 className="font-extrabold text-sm text-emerald-900">لجنة تقييم وحصر الأضرار</h3><p className="text-[8px] text-slate-400">عين إبل، قضاء بنت جبيل</p></div>
                              </div>
                              <div className="text-left"><h4 className="font-black text-slate-900 text-sm">مستند الكشف الهندسي</h4><p className="font-mono text-[8px] text-slate-400">{selectedSurvey.timestamp}</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border text-[10px]">
                              <div>المالك: <strong>{selectedSurvey.ownerName}</strong></div><div>الهاتف: <strong>{selectedSurvey.ownerPhone}</strong></div>
                              <div>رقم السجل: <strong>{selectedSurvey.ownerId}</strong></div><div>نوع العقار: <strong>{selectedSurvey.propertyType}</strong></div>
                              <div className="col-span-2 border-t pt-2 flex justify-between items-center">
                                <span>إحداثيات المسح: {selectedSurvey.gps.lat}، {selectedSurvey.gps.lng}</span>
                                {selectedSurvey.gps.locationUrl && <a href={selectedSurvey.gps.locationUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-bold text-[9px]">📍 فتح الخريطة أونلاين</a>}
                              </div>
                            </div>

                            {/* تفاصيل السلامة الإنشائية */}
                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">1. تقييم الهيكل الإنشائي الحامل والغرف المدمرة</h4>
                              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded text-[9.5px]">
                                <div>أعمدة: {selectedSurvey.structural.columns}</div><div>أسقف: {selectedSurvey.structural.beams}</div><div>أساسات: {selectedSurvey.structural.foundations}</div>
                              </div>
                              
                              {/* عرض الغرف المدمرة المسجلة ديناميكياً */}
                              {selectedSurvey.structural.destroyed_rooms_count > 0 ? (
                                <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 space-y-1.5 mt-2">
                                  <span className="font-black text-red-800 block text-[10px]">🏚️ تفاصيل الغرف المدمرة بالكامل ({selectedSurvey.structural.destroyed_rooms_count} غرف):</span>
                                  {selectedSurvey.structural.destroyed_rooms_list && selectedSurvey.structural.destroyed_rooms_list.map((r, i) => (
                                    <div key={i} className="flex justify-between bg-white/90 p-1.5 rounded border border-red-100 text-[9.5px]">
                                      <span className="font-bold text-slate-800">غرفة {i + 1}: {r.type}</span>
                                      <span className="text-red-700 font-semibold">ضرر: {r.damage}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-green-50 p-2 rounded text-green-800 text-[9px] mt-2">✓ لم يتم رصد أي غرف مدمرة بالكامل في الهيكل الحامل.</div>
                              )}
                            </div>

                            {/* تفاصيل الفتحات */}
                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">2. النوافذ والأبواب والفتحات المتضررة</h4>
                              <div className="bg-slate-50 p-2.5 rounded text-[9.5px] space-y-1.5">
                                <div>جدران البلوك: {selectedSurvey.nonStructural.walls}</div>
                                <div className="grid grid-cols-2 gap-2 border-t pt-1.5 text-[9px]">
                                  <div>
                                    <strong className="text-emerald-800 block">النوافذ والألومنيوم:</strong>
                                    <ul className="list-disc list-inside">
                                      <li>ألمنيوم صغير: {selectedSurvey.nonStructural.windows_alu_small ?? 0}</li>
                                      <li>ألمنيوم كبير: {selectedSurvey.nonStructural.windows_alu_large ?? 0}</li>
                                      <li>حديد وحماية: {selectedSurvey.nonStructural.windows_steel ?? 0}</li>
                                      <li>واجهات زجاجية: {selectedSurvey.nonStructural.windows_facade ?? 0}</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <strong className="text-emerald-800 block">الأبواب:</strong>
                                    <ul className="list-disc list-inside">
                                      <li>خشبية داخلية: {selectedSurvey.nonStructural.doors_wood ?? 0}</li>
                                      <li>حديد مصفح رئيسية: {selectedSurvey.nonStructural.doors_iron ?? 0}</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* تقييم الحمامات والأسلاك الصحية */}
                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">3. بند الحمامات والشبكة الصحية</h4>
                              <div className="bg-slate-50 p-2 rounded text-[9.5px] flex justify-between">
                                <span>عدد الحمامات المتضررة: {selectedSurvey.bathrooms?.count ?? 0}</span>
                                <span>التمديدات والأطقم الصحية: {selectedSurvey.bathrooms?.status ?? "سليم"}</span>
                              </div>
                            </div>

                            {/* تقييم العفش والأجهزة الكهربائية المطور بكميات ونوع الخراب */}
                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">4. جرد الأثاث والعفش الداخلي للتعويضات</h4>
                              <table className="w-full text-right text-[9px] border">
                                <thead className="bg-slate-50">
                                  <tr className="border-b"><th className="p-1">نوع الأثاث</th><th className="p-1 text-center">العدد</th><th className="p-1">توصيف ونوع الخراب</th></tr>
                                </thead>
                                <tbody>
                                  {[
                                    {l: "غرف نوم كاملة", k:"bedroom"}, {l: "أسرة منفردة", k:"beds"}, {l: "خزائن ملابس", k:"wardrobes"},
                                    {l: "صالونات وكنب", k:"sofa"}, {l: "طاولات سفرة", k:"dining"}, {l: "سجاد وموكيت", k:"carpet"}
                                  ].map((item, idx) => {
                                    const count = selectedSurvey.contents[`furniture_${item.k}_count`] ?? 0;
                                    const damage = selectedSurvey.contents[`furniture_${item.k}_damage`] ?? "سليم";
                                    return (
                                      <tr key={idx} className="border-b">
                                        <td className="p-1">{item.l}</td><td className="p-1 text-center font-bold text-slate-950">{count}</td><td className="p-1 text-slate-500">{count > 0 ? damage : "-"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">5. الأجهزة الكهربائية القيمة المتضررة</h4>
                              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded text-[9px] text-center">
                                <div>براد: <strong>{selectedSurvey.contents.appliances_fridge}</strong></div>
                                <div>شاشة: <strong>{selectedSurvey.contents.appliances_tv}</strong></div>
                                <div>فرن/غاز: <strong>{selectedSurvey.contents.appliances_cooker}</strong></div>
                                <div>مدفأة: <strong>{selectedSurvey.contents.appliances_heater}</strong></div>
                                <div>مكيف: <strong>{selectedSurvey.contents.appliances_ac}</strong></div>
                                <div>غسالة: <strong>{selectedSurvey.contents.appliances_washing}</strong></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold border-r-2 border-emerald-600 pr-1 text-slate-900">6. الملاحق والأسوار والموقع</h4>
                              <div className="bg-slate-50 p-2 rounded text-[9.5px]">
                                <div>السور الخارجي: {selectedSurvey.external.fences}</div>
                                {selectedSurvey.external.annexes_detailed && (
                                  <div className="mt-1 border-t pt-1.5 space-y-1">
                                    {Object.entries(selectedSurvey.external.annexes_detailed).filter(([_,v])=>v.selected).map(([k,v]) => {
                                      const lbl = k==='garage'?"كراج":k==='workroom'?"غرفة عمل":k==='attic'?"سقيفة":"قرميد";
                                      return <div key={k}>• {lbl} بمساحة ({v.area} م²): <span className="font-semibold text-red-800">{v.damage}</span></div>;
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-2 bg-slate-50 rounded border">
                              <strong className="text-slate-500 block">توصيات المهندس الميداني:</strong>
                              <p className="font-bold mt-1">{selectedSurvey.notes || "لا توجد ملاحظات."}</p>
                              {selectedSurvey.audioNote && (
                                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                                  <span className="text-[10px] text-emerald-800 font-bold">🎙️ ملاحظة صوتية:</span>
                                  <audio src={selectedSurvey.audioNote} controls className="h-6 w-full max-w-[200px]" />
                                </div>
                              )}
                            </div>

                            {selectedSurvey.photos && selectedSurvey.photos.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                {selectedSurvey.photos.map((ph, i) => <img key={i} src={ph} className="rounded border aspect-video object-cover" alt="site documentation" />)}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-4 text-center mt-6 items-end">
                              <div>
                                <span className="text-[9px] block text-slate-400 font-bold">توقيع المهندس الفاحص</span>
                                <img src={selectedSurvey.signature} className="h-10 mx-auto object-contain bg-slate-50 rounded px-2" alt="signature" />
                                <span className="font-bold text-[10px]">{selectedSurvey.engineerName}</span>
                              </div>
                              <div>
                                <span className="text-[9px] block text-slate-400 font-bold mb-2">قرار بلدية عين إبل</span>
                                {selectedSurvey.status === "معتمد" ? (
                                  <div className="border border-emerald-500 text-emerald-700 font-bold text-[10px] py-1.5 bg-emerald-50 rounded-xl max-w-[150px] mx-auto animate-pulse">✓ معتمد للتعويض</div>
                                ) : (
                                  <div className="border border-amber-300 text-amber-700 font-bold text-[10px] py-1.5 bg-amber-50 rounded-xl max-w-[150px] mx-auto">قيد المراجعة الفنية</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <button onClick={() => window.print()} className="bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md w-full">🖨️ طباعة أو تصدير كـ PDF</button>
                        </div>
                      ) : (
                        <p className="text-center py-20 text-slate-400 text-xs font-semibold">يرجى اختيار استمارة من قائمة اليمين لمراجعتها.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* إدارة وصلاحيات الحسابات للـ Admin */}
              {currentUser?.role === "Admin" && currentTab === "supervisor-users" && (
                <div className="p-4 space-y-6 flex-1 flex flex-col text-slate-800">
                  <div className="border-b pb-3">
                    <h2 className="text-base font-bold text-slate-900">إدارة حسابات طاقم الفحص والترميم السحابية</h2>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
                    <div className="xl:col-span-5 bg-slate-50 p-5 rounded-2xl border space-y-4">
                      <h3 className="text-xs font-bold text-slate-700">➕ إنشاء حساب موظف جديد</h3>
                      <form onSubmit={handleCreateNewUser} className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">الاسم الكامل للمهندس/المشرف</label>
                          <input type="text" placeholder="مثال: م. طوني حداد" className="w-full p-2.5 bg-white text-slate-900 border rounded-xl outline-none focus:border-emerald-600" value={newEngineerForm.name} onChange={e=>setNewEngineerForm({...newEngineerForm, name:e.target.value})} required/>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">اسم المستخدم (Username)</label>
                          <input type="text" placeholder="مثال: tony_ebel" className="w-full p-2.5 bg-white text-slate-900 border rounded-xl text-left outline-none focus:border-emerald-600" value={newEngineerForm.username} onChange={e=>setNewEngineerForm({...newEngineerForm, username:e.target.value})} required/>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">كلمة المرور</label>
                          <input type="text" placeholder="تعيين كلمة السر للموظف" className="w-full p-2.5 bg-white text-slate-900 border rounded-xl text-left outline-none focus:border-emerald-600" value={newEngineerForm.password} onChange={e=>setNewEngineerForm({...newEngineerForm, password:e.target.value})} required/>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">رتبة الصلاحية</label>
                          <select className="w-full p-2.5 bg-white border text-slate-900 rounded-xl outline-none focus:border-emerald-600" value={newEngineerForm.role} onChange={e=>setNewEngineerForm({...newEngineerForm, role:e.target.value})}>
                            <option value="Field_Engineer">مهندس ميداني (للمسح والاستمارات)</option>
                            <option value="Supervisor">مشرف عام بلدية (مراجعة واعتماد التراخيص)</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow">إنشاء وتنشيط الحساب</button>
                      </form>
                    </div>

                    <div className="xl:col-span-7 space-y-4">
                      <h3 className="text-xs font-bold text-slate-700">👥 قائمة طاقم العمل الحاليين ({usersList.length})</h3>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 text-xs">
                        {usersList.map(u => (
                          <div key={u.id} className="p-3 bg-white border rounded-xl flex justify-between items-center gap-3 shadow-sm hover:border-slate-300">
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-900">{u.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>الحساب: <strong>{u.username}</strong></span>
                                <span>•</span>
                                <span>
                                  السر: <strong>{showPasswords[u.id] ? u.password : "••••••"}</strong>
                                  <button onClick={()=>togglePasswordVisibility(u.id)} className="text-emerald-750 hover:underline font-bold mr-1.5">{showPasswords[u.id] ? "إخفاء" : "عرض"}</button>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded ${u.role === "Supervisor" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}`}>{u.role === "Supervisor" ? "مشرف" : "مهندس"}</span>
                              <button onClick={() => setEditingUser({ id: u.id, name: u.name, username: u.username, newPassword: "" })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] border">تغيير السر</button>
                              <button onClick={() => handleDeleteUser(u.id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] border border-red-200">حذف 🗑️</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {editingUser && (
                        <form onSubmit={handleUpdatePassword} className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col md:flex-row gap-3 items-end">
                          <div className="flex-1 w-full space-y-1 text-xs">
                            <div className="flex justify-between font-bold"><span>تغيير كلمة المرور لـ {editingUser.name}</span><button type="button" onClick={()=>setEditingUser(null)} className="text-red-650 hover:underline font-extrabold text-[11px]">إلغاء</button></div>
                            <input type="text" placeholder="السر الجديد..." className="w-full p-2 bg-white text-slate-900 border rounded-xl text-left outline-none" value={editingUser.newPassword} onChange={e=>setEditingUser({...editingUser, newPassword:e.target.value})} required/>
                          </div>
                          <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition">تحديث</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </section>

          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-500 py-4 text-center text-xs border-t border-slate-900 mt-auto">
        تطبيق سند لإدارة وإعادة إعمار الوحدات المتضررة © 2026 | اللجنة الهندسية لبلدية عين إبل (جنوب لبنان)
      </footer>

    </div>
  );
}
