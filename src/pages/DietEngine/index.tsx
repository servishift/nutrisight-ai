import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, RefreshCw, ChefHat, Activity, HeartPulse, Lock, Crown, CalendarDays, ArrowRight, Shield, Mail, Send } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { useToast } from '@/hooks/use-toast';

interface Meal {
  meal_name: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  gi: number;
}

interface DailyPlan {
  day: number;
  meals: Meal[];
  daily_calories: number;
}

interface DietReport {
  patient_info: {
    tdee: number;
    target_protein: number;
    target_carbs: number;
    target_fats: number;
    applied_rules: string[];
    num_days: number;
    generated_at: string;
  };
  weekly_plan: DailyPlan[];
}

export function DietEngine() {
  const { hasFeature, loading: subLoading } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DietReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activity_level: 'sedentary',
    goal: 'maintenance',
    diet_preference: 'veg',
    days: '7'
  });

  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  // Load persistence
  useEffect(() => {
    const savedFormData = localStorage.getItem('nutrisight_diet_form');
    const savedReport = localStorage.getItem('nutrisight_diet_report');
    
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(parsed.formData || formData);
        setConditions(parsed.conditions || []);
        setAllergies(parsed.allergies || []);
      } catch (e) { console.error("Persistence load error", e); }
    }
    
    if (savedReport) {
      try {
        setReport(JSON.parse(savedReport));
      } catch (e) { console.error("Report load error", e); }
    }
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem('nutrisight_diet_form', JSON.stringify({ formData, conditions, allergies }));
  }, [formData, conditions, allergies]);

  useEffect(() => {
    if (report) {
      localStorage.setItem('nutrisight_diet_report', JSON.stringify(report));
    }
  }, [report]);

  const conditionOptions = ['Diabetes', 'Hypertension', 'Kidney Stones', 'Heart Disease', 'PCOS'];
  const allergyOptions = ['Dairy', 'Gluten', 'Peanut', 'Soy', 'Shellfish'];

  const handleCheckboxChange = (value: string, stateArray: string[], setStateFunc: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (stateArray.includes(value)) {
      setStateFunc(stateArray.filter(i => i !== value));
    } else {
      setStateFunc([...stateArray, value]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem('foodintel_auth_tokens');
      const tokens = stored ? JSON.parse(stored) : null;
      if (!tokens?.accessToken) {
        setError('Please log in to generate a diet plan.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/diet/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ ...formData, conditions, allergies })
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Please log in to generate a diet plan.');
        return;
      }
      if (response.status === 402) {
        setError('This feature requires a Pro subscription. Please upgrade your plan.');
        return;
      }
      if (response.status === 429) {
        setError('Daily limit reached (10 plans/day). Try again tomorrow.');
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate diet plan');
      }

      setReport(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred connecting to the Diet AI Engine.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = document.getElementById('diet-report-pdf');
    if (!element) return;
    
    const opt = {
      margin: 0.3,
      filename: `Medical_Diet_Report_${formData.name || 'Patient'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const sendEmailReport = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);

    try {
      // Generate PDF as blob
      const element = document.getElementById('diet-report-pdf');
      if (!element) {
        throw new Error('Report element not found');
      }

      const opt = {
        margin: 0.3,
        filename: `Medical_Diet_Report_${formData.name || 'Patient'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      // Convert blob to base64
      const reader = new FileReader();
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const stored = localStorage.getItem('foodintel_auth_tokens');
      const tokens = stored ? JSON.parse(stored) : null;

      const response = await fetch(`/api/diet/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {}),
        },
        body: JSON.stringify({
          patient_name: formData.name || 'Patient',
          diet_report: report,
          pdf_data: pdfBase64
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Email Sent Successfully!",
          description: `Diet plan with PDF has been sent to ${emailAddress}`,
        });
        setShowEmailDialog(false);
        setEmailAddress('');
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      toast({
        title: "Failed to Send Email",
        description: err.message || 'Please try again later',
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (subLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-muted-foreground animate-pulse">Verifying Premium Access...</p>
      </div>
    );
  }

  // Premium Gating
  if (!hasFeature('diet_engine')) {
    return (
      <div className="container mx-auto p-4 max-w-4xl mt-12 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="border-2 border-indigo-100 shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 h-2 w-full" />
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto bg-indigo-50 h-20 w-20 rounded-full flex items-center justify-center">
              <Crown className="h-10 w-10 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Premium Feature</h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">
                The AI Medical Diet Engine is available exclusively for our <span className="font-bold text-indigo-600">Pro</span> and <span className="font-bold text-indigo-600">Enterprise</span> members.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
               <div className="bg-slate-50 p-4 rounded-xl border flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-semibold">14-Day Medical Plans</span>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border flex items-center gap-3">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-semibold">Medical Rule Engine</span>
               </div>
            </div>
            <Button asChild size="lg" className="px-12 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
              <Link to="/pricing">Upgrade to Pro Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-7xl animate-in fade-in duration-500 mt-8 mb-8">
      
      {!report ? (
        <Card className="max-w-3xl mx-auto shadow-2xl border-none ring-1 ring-slate-200">
          <CardHeader className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-600 text-white rounded-t-xl p-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl font-black tracking-tight">
                  <ChefHat className="h-8 w-8" /> AI Diet Engine
                </CardTitle>
                <CardDescription className="text-indigo-100 text-lg mt-2 font-medium opacity-90">
                  Medical-grade personalized nutrition planning.
                </CardDescription>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Crown className="h-3 w-3" /> Pro Access
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleGenerate} className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b-2 border-slate-100 pb-3 text-slate-800">
                  <Activity className="h-5 w-5 text-indigo-600" /> 1. Patient Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Full name</Label>
                    <Input id="name" placeholder="E.g. Rahul Sharma" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} className="h-11 bg-slate-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Age</Label>
                    <Input id="age" type="number" placeholder="25" value={formData.age} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, age: e.target.value})} className="h-11 bg-slate-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="70" value={formData.weight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, weight: e.target.value})} className="h-11 bg-slate-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Height (cm)</Label>
                    <Input id="height" type="number" placeholder="175" value={formData.height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, height: e.target.value})} className="h-11 bg-slate-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Gender</Label>
                    <Select value={formData.gender} onValueChange={(val: string) => setFormData({...formData, gender: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Activity Level</Label>
                    <Select value={formData.activity_level} onValueChange={(val: string) => setFormData({...formData, activity_level: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (No Exercise)</SelectItem>
                        <SelectItem value="light">Lightly Active (1-2 Days)</SelectItem>
                        <SelectItem value="moderate">Moderately Active (3-5 Days)</SelectItem>
                        <SelectItem value="active">Very Active (Daily)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Health Goal</Label>
                    <Select value={formData.goal} onValueChange={(val: string) => setFormData({...formData, goal: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Fat Loss</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Building</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Dietary Filter</Label>
                    <Select value={formData.diet_preference} onValueChange={(val: string) => setFormData({...formData, diet_preference: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veg">Vegetarian</SelectItem>
                        <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Plan Duration</Label>
                    <Select value={formData.days} onValueChange={(val: string) => setFormData({...formData, days: val})}>
                      <SelectTrigger className="h-11 bg-indigo-50/50 border-indigo-200"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Days (Trial)</SelectItem>
                        <SelectItem value="7">7 Days (Full Week)</SelectItem>
                        <SelectItem value="10">10 Days (Extended)</SelectItem>
                        <SelectItem value="14">14 Days (Transformation)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b-2 border-slate-100 pb-3 text-slate-800">
                  <HeartPulse className="h-5 w-5 text-red-600" /> 2. Medical Isolation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-slate-400 font-semibold text-xs tracking-wider flex items-center gap-1.5 uppercase">
                       Conditions <div className="h-1 flex-1 bg-slate-50" />
                    </Label>
                    <div className="grid grid-cols-2 gap-y-3">
                      {conditionOptions.map(cond => (
                        <div key={cond} className="flex items-center space-x-3 group">
                          <Checkbox id={`cond-${cond}`} checked={conditions.includes(cond)} onCheckedChange={() => handleCheckboxChange(cond, conditions, setConditions)} className="border-slate-300 data-[state=checked]:bg-indigo-600" />
                          <Label htmlFor={`cond-${cond}`} className="text-sm cursor-pointer text-slate-600 font-medium group-hover:text-indigo-600 transition-colors">{cond}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-400 font-semibold text-xs tracking-wider flex items-center gap-1.5 uppercase">
                       Allergen Triggers <div className="h-1 flex-1 bg-slate-50" />
                    </Label>
                    <div className="grid grid-cols-2 gap-y-3">
                      {allergyOptions.map(alg => (
                        <div key={alg} className="flex items-center space-x-3 group">
                          <Checkbox id={`alg-${alg}`} checked={allergies.includes(alg)} onCheckedChange={() => handleCheckboxChange(alg, allergies, setAllergies)} className="border-slate-300 data-[state=checked]:bg-red-600" />
                          <Label htmlFor={`alg-${alg}`} className="text-sm cursor-pointer text-slate-600 font-medium group-hover:text-red-600 transition-colors uppercase tracking-tight">{alg}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium animate-in shake-in duration-300">{error}</div>}

              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-800 hover:to-purple-700 text-white shadow-2xl shadow-indigo-100 text-xl font-black h-16 rounded-2xl group transition-all" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Analyzing Food Matrix...</> : <span className="flex items-center gap-2">Generate {formData.days}-Day Medical Plan <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></span>}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10 mx-auto max-w-6xl">
            <div className="flex items-center gap-4">
               <div className="bg-green-100 p-2.5 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Plan Generated</h2>
                  <p className="text-slate-500 text-sm font-medium opacity-80">Hyper-personalized & Medical verified</p>
               </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" onClick={() => setReport(null)} className="flex-1 md:flex-none border-slate-200 hover:bg-slate-50 font-bold h-11">
                <RefreshCw className="mr-2 h-4 w-4" /> Recalculate
              </Button>
              <Button onClick={() => setShowEmailDialog(true)} variant="outline" className="flex-1 md:flex-none border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-bold h-11 px-6">
                <Mail className="mr-2 h-4 w-4" /> Email Report
              </Button>
              <Button onClick={downloadPDF} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-100">
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </div>
          </div>

          <div id="diet-report-pdf" className="bg-white p-12 rounded-3xl shadow-2xl border-none max-w-6xl mx-auto relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
               <h1 className="text-[120px] font-black tracking-tighter text-indigo-900 border-8 border-indigo-900 px-8 select-none">NUTRISIGHT AI</h1>
            </div>

            <div className="relative z-10">
              <div className="grid grid-cols-2 border-b-2 border-slate-900 pb-10 mb-10 items-end">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center text-white">
                      <ChefHat className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl tracking-tighter text-indigo-700">NUTRISIGHT AI</h4>
                      <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] leading-none">MEDICAL INTELLIGENCE ENGINE</p>
                    </div>
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight mt-4">Personalized<br/>Diet Report</h1>
                </div>
                <div className="text-right space-y-2 border-l pl-10 border-slate-100">
                  <p className="font-black text-3xl text-slate-900">{formData.name || 'Patient Profile'}</p>
                  <div className="flex justify-end gap-3 text-sm font-bold text-slate-500">
                    <span className="bg-slate-50 px-3 py-1 rounded-md border">{formData.age} YRS</span>
                    <span className="bg-slate-50 px-3 py-1 rounded-md border">{formData.weight} KG</span>
                    <span className="bg-slate-50 px-3 py-1 rounded-md border">{formData.height} CM</span>
                  </div>
                  <p className="text-indigo-600 text-sm font-black flex items-center justify-end gap-1.5 uppercase tracking-widest mt-4">
                    <CalendarDays className="h-4 w-4" /> {report.patient_info.num_days}-Day Medical Cycle
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Budget</p>
                  <p className="text-3xl font-black">{report.patient_info.tdee} <span className="text-xs text-slate-500">KCAL</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Target Protein</p>
                  <p className="text-3xl font-black text-slate-900">{report.patient_info.target_protein}<span className="text-xs text-slate-500 font-medium ml-1">G</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Target Carbs</p>
                  <p className="text-3xl font-black text-slate-900">{report.patient_info.target_carbs}<span className="text-xs text-slate-500 font-medium ml-1">G</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Target Fats</p>
                  <p className="text-3xl font-black text-slate-900">{report.patient_info.target_fats}<span className="text-xs text-slate-500 font-medium ml-1">G</span></p>
                </div>
              </div>

              {report.patient_info.applied_rules.length > 0 && (
                <div className="mb-12 p-6 bg-red-50/50 rounded-2xl border border-red-100 ring-4 ring-red-50/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-600 h-8 w-8 rounded-lg flex items-center justify-center text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-red-900 text-lg uppercase tracking-tight">Active Medical Isolation</h3>
                  </div>
                  <p className="text-red-800 font-medium text-base">
                    AI engine has strictly excluded items triggering: <span className="font-black bg-red-100 px-2.5 py-0.5 rounded-full ml-1">{report.patient_info.applied_rules.join(', ')}</span>.
                  </p>
                </div>
              )}

              <div className="space-y-12">
                {report.weekly_plan.map((day) => (
                  <div key={day.day} className="rounded-3xl border-2 border-slate-100 overflow-hidden page-break-inside-avoid shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="bg-slate-50 flex justify-between items-center px-8 py-5 border-b-2 border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-sm">
                          {day.day}
                        </div>
                        <h3 className="font-black text-xl text-slate-900">Day Cycle Profile</h3>
                      </div>
                      <span className="text-sm font-black bg-white px-4 py-1.5 rounded-full border-2 text-indigo-600 border-indigo-50 shadow-sm uppercase tracking-widest">
                        Total Energy: {day.daily_calories} kcal
                      </span>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b-2 border-slate-100 text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">
                          <tr>
                            <th className="px-8 py-5">Meal Schedule</th>
                            <th className="px-8 py-5">AI Recommendation</th>
                            <th className="px-8 py-5 text-right">Energy</th>
                            <th className="px-8 py-5 text-right">Macros (P/C/F)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {day.meals.map((meal, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-8 py-6 align-top">
                                <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{meal.meal_name}</div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-indigo-700 font-black text-lg tracking-tight mb-1">{meal.food}</div>
                                {meal.gi && (
                                   <div className="flex items-center gap-1.5 opacity-60">
                                      <div className={`h-1.5 w-1.5 rounded-full ${meal.gi < 55 ? 'bg-green-500' : 'bg-red-500'}`} />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">Glycemic Load: {meal.gi}</span>
                                   </div>
                                )}
                              </td>
                              <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                                {meal.calories} <span className="text-[10px] text-slate-400">KC</span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="text-xs font-bold text-slate-600 space-x-2">
                                  <span className="text-blue-600">{meal.protein}g</span>
                                  <span className="text-green-600">{meal.carbs}g</span>
                                  <span className="text-orange-600">{meal.fat}g</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-16 text-center space-y-4 border-t-2 border-slate-100 pt-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Medical Verification Disclaimer</p>
                <p className="text-slate-500 text-sm max-w-2xl mx-auto italic font-medium leading-relaxed">
                  This plan is generated by an artificial intelligence model using the Anuvaad INDB and USDA FoodData Central databases. While we apply strict medical rules, this report should be reviewed by a certified medical practitioner or dietitian before implementation.
                </p>
                <div className="pt-8 flex justify-center gap-12 text-slate-300">
                   <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Secure Report</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">AI Validated</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Premium Clinical</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Send Diet Plan via Email
              </CardTitle>
              <CardDescription className="text-indigo-100">
                The complete diet plan will be sent as an email with PDF attachment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendEmailReport()}
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  📧 The complete {report?.patient_info.num_days || 7}-day meal plan will be sent with a PDF attachment.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailDialog(false);
                    setEmailAddress('');
                  }}
                  className="flex-1"
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmailReport}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={sendingEmail || !emailAddress}
                >
                  {sendingEmail ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Send Email</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
