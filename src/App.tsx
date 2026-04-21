/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  Plus, 
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  CalendarDays,
  Info
} from 'lucide-react';

interface CalculationResult {
  totalOvertimeHours: number;
  totalPay: number;
  cappedPay: number;
  consumedHours: number;
  remainingHours: number;
}

export default function App() {
  // Inputs
  const [civilServantWorkdays, setCivilServantWorkdays] = useState<string>('');
  const [totalDaysInMonth, setTotalDaysInMonth] = useState<string>('');
  const [standardLeaveDays, setStandardLeaveDays] = useState<string>('');
  
  // Incremental Inputs
  const [leaveStayOutCount, setLeaveStayOutCount] = useState<number>(0);
  const [flexibleRestDays, setFlexibleRestDays] = useState<number>(0);
  const [leaveDays, setLeaveDays] = useState<number>(0);
  const [overtimeCompDays, setOvertimeCompDays] = useState<number>(0);
  const [overtimeCompStayOut, setOvertimeCompStayOut] = useState<number>(0);
  const [otherLeaveStayOut, setOtherLeaveStayOut] = useState<number>(0); // 請休外宿次數
  
  const [hourlyPay, setHourlyPay] = useState<string>('');
  
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time calculation: 總放假天數
  const totalOffDays = useMemo(() => {
    const l = parseFloat(standardLeaveDays) || 0;
    const s_out = leaveStayOutCount * 0.5;
    const f = flexibleRestDays * 1;
    const p = leaveDays * 1;
    const o = overtimeCompDays * 1;
    const o_out = overtimeCompStayOut * 0.5;
    const p_out = otherLeaveStayOut * 0.5;
    
    return l + s_out + f + p + o + o_out + p_out;
  }, [standardLeaveDays, leaveStayOutCount, flexibleRestDays, leaveDays, overtimeCompDays, overtimeCompStayOut, otherLeaveStayOut]);

  const validateAndCalculate = () => {
    setError(null);
    
    // Use default values if empty
    const dStr = totalDaysInMonth.trim();
    const wStr = civilServantWorkdays.trim();
    const lStr = standardLeaveDays.trim();

    const d = dStr === '' ? 30 : parseFloat(dStr);
    const w = wStr === '' ? 20 : parseFloat(wStr);
    const l = parseFloat(lStr);
    const pay = parseFloat(hourlyPay) || 0;

    if (isNaN(l)) {
      setError('請填寫必要欄位：本休整日');
      return;
    }

    if (d < 0) {
      setError('本月總天數不得低於 0 天');
      return;
    }

    if (d > 31) {
      setError('本月總天數不得超過 31 天');
      return;
    }

    if (w < 10) {
      setError('公務員上班日不得低於 10 天');
      return;
    }

    const totalOT = (d * 22) 
                   - (l * 22) 
                   - (leaveStayOutCount * 12) 
                   - (flexibleRestDays * 22) 
                   - (w * 8) 
                   - (leaveDays * 14) 
                   - (overtimeCompDays * 12) 
                   - (overtimeCompStayOut * 10) 
                   - (otherLeaveStayOut * 8);

    const rawPay = totalOT * pay;
    const capped = Math.min(19000, Math.max(0, rawPay));
    
    let consumed = 0;
    let remaining = 0;

    if (pay > 0 && totalOT > 0) {
      if (rawPay > 19000) {
        consumed = Math.ceil(19000 / pay);
        remaining = totalOT - consumed;
      } else {
        consumed = totalOT;
        remaining = 0;
      }
    } else {
      consumed = 0;
      remaining = Math.max(0, totalOT);
    }

    setResult({
      totalOvertimeHours: totalOT,
      totalPay: rawPay,
      cappedPay: capped,
      consumedHours: consumed,
      remainingHours: remaining
    });
  };

  const handleReset = () => {
    setCivilServantWorkdays('');
    setTotalDaysInMonth('');
    setStandardLeaveDays('');
    setLeaveStayOutCount(0);
    setFlexibleRestDays(0);
    setLeaveDays(0);
    setOvertimeCompDays(0);
    setOvertimeCompStayOut(0);
    setOtherLeaveStayOut(0);
    setHourlyPay('');
    setResult(null);
    setError(null);
  };

  const StepperInput = ({ 
    label, 
    value, 
    onChange, 
    description,
    info
  }: { 
    label: string, 
    value: number, 
    onChange: (val: number) => void, 
    description?: string,
    info?: string
  }) => (
    <div className="flex flex-col items-center text-center gap-1.5 group/item">
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-medium text-slate-600 block whitespace-nowrap">{label}</label>
        {info && (
          <div className="relative group/tooltip">
            <Info size={12} className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl font-normal leading-tight">
              {info}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-0.5 w-full max-w-[64px]">
        <button 
          onClick={() => onChange(value + 1)}
          className="w-full h-6 flex items-center justify-center bg-slate-50 text-slate-400 rounded-t-lg border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90"
        >
          <Plus size={14} />
        </button>
        <input 
          type="number"
          readOnly
          value={value}
          className="w-full bg-white border-x border-slate-200 py-1 text-center text-xl font-bold text-slate-900 outline-none"
        />
        <button 
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-full h-6 flex items-center justify-center bg-slate-50 text-slate-400 rounded-b-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-90"
        >
          <Minus size={14} />
        </button>
      </div>

      {description && <span className="text-[9px] text-slate-400 font-normal mt-0.5">({description})</span>}
    </div>
  );

    // Modal for errors
    const ErrorModal = () => (
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setError(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-[90vw] w-fit border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">輸入資訊有誤</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 whitespace-nowrap px-4">
                {error}
              </p>
              <button 
                onClick={() => setError(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                確認並返回
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center font-sans">
      <ErrorModal />
      <div className="max-w-6xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gov-red rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
              <ShieldAlert className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight font-display">新北市政府消防局</h1>
              <p className="text-slate-500 text-sm font-medium tracking-wide">外勤人員超勤時數計算器</p>
            </div>
          </div>
        </header>

        {/* Main Bento Grid */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Core Parameters (Top Left) */}
          <section className="bento-card md:col-span-1 border-l-4 border-l-blue-500 flex flex-col order-1">
            <label className="label-small">核心參數設定</label>
            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">本月總天數 (必填)</label>
                <input 
                  type="number" 
                  min="0"
                  value={totalDaysInMonth}
                  onChange={(e) => setTotalDaysInMonth(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="input-field font-semibold"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">公務員上班日 (必填)</label>
                <input 
                  type="number" 
                  min="10"
                  value={civilServantWorkdays}
                  onChange={(e) => setCivilServantWorkdays(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="input-field font-semibold"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">本休整日 (必填)</label>
                <input 
                  type="number" 
                  value={standardLeaveDays}
                  onChange={(e) => setStandardLeaveDays(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="input-field font-semibold"
                  placeholder="0"
                />
              </div>
            </div>
          </section>

          {/* Card 3: Salary Settings (Bottom Left -> Moved for mobile order) */}
          <section className="bento-card md:col-span-1 bg-slate-900 border-none flex flex-col justify-center group overflow-hidden relative min-h-[160px] order-2 md:order-3">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
            <div className="relative z-10">
              <label className="label-small text-slate-400">薪資設定</label>
              <div className="">
                <label className="text-xs text-slate-300 block mb-2 font-medium">每小時加班費 ($)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <DollarSign size={16} />
                  </div>
                  <input 
                    type="number" 
                    value={hourlyPay}
                    onChange={(e) => setHourlyPay(e.target.value)}
                    placeholder="請輸入..."
                    className="w-full bg-slate-800 border-slate-700 text-white rounded-lg pl-9 pr-4 py-3 text-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Leave & Stay Out (Top Right / Center) */}
          <section className="bento-card md:col-span-2 md:row-span-2 flex flex-col order-3 md:order-2">
            <div className="flex justify-between items-start md:items-center mb-6 gap-4">
              <label className="label-small mb-0">休假與外宿設定</label>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">總放假天數</span>
                  <span className="text-lg font-bold text-blue-600 font-display">{totalOffDays.toFixed(1)}</span>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="重置"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8 flex-1">
              {/* Row 1: Days */}
              <StepperInput label="彈性休息整日" value={flexibleRestDays} onChange={setFlexibleRestDays} description="1.0d" />
              <StepperInput label="請休整日" value={leaveDays} onChange={setLeaveDays} description="1.0d" info="含身心調適、公假、事病假等" />
              <StepperInput label="超勤補休整日" value={overtimeCompDays} onChange={setOvertimeCompDays} description="1.0d" />
              
              {/* Row 2: Stay Out counts */}
              <StepperInput label="本休外宿次數" value={leaveStayOutCount} onChange={setLeaveStayOutCount} description="0.5d" />
              <StepperInput label="請休外宿次數" value={otherLeaveStayOut} onChange={setOtherLeaveStayOut} description="0.5d" />
              <StepperInput label="超勤補休外宿次數" value={overtimeCompStayOut} onChange={setOvertimeCompStayOut} description="0.5d" />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={validateAndCalculate}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                <span className="text-base">確認計算</span>
              </button>
            </div>
          </section>

          {/* Card 4: Results (Bottom Wide) */}
          <section 
            className={`bento-card md:col-span-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 transition-all duration-700 order-4 relative ${!result ? 'opacity-40 grayscale blur-[2px]' : 'border-blue-200 shadow-xl shadow-blue-500/5 bg-white'}`}
          >
            <div className="flex-1 md:border-r border-slate-100 md:pr-8">
              <span className="label-small">總加班時數</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-display text-slate-900">
                  {result ? result.totalOvertimeHours : '--'}
                </span>
                <span className="text-slate-400 font-medium text-sm">小時</span>
              </div>
            </div>

            <div className="flex-1 md:border-r border-slate-100 md:px-8">
              <span className="label-small">實領加班費 <span className="text-slate-300 font-normal">(上限 19K)</span></span>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={result?.cappedPay}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-2xl font-bold text-emerald-600 font-display">$</span>
                  <span className="text-4xl font-bold text-emerald-600 font-display tracking-tight">
                    {result ? Math.floor(result.cappedPay).toLocaleString() : '--'}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex-1 md:pl-8">
              <span className="label-small">剩餘時數 <span className="text-slate-300 font-normal">(未支薪)</span></span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold font-display ${result && result.remainingHours > 0 ? 'text-orange-500' : 'text-slate-300'}`}>
                  {result ? result.remainingHours : '--'}
                </span>
                <span className="text-slate-400 font-medium text-sm">小時</span>
              </div>
            </div>
            
            {result && result.totalPay > 19000 && (
              <div className="absolute bottom-1 right-3 text-[9px] font-bold text-slate-300 flex items-center gap-1">
                <Clock size={10} />
                ORIGINAL CALC: {Math.floor(result.totalPay).toLocaleString()}
              </div>
            )}

            <div className="absolute bottom-1 left-3 text-[9px] text-slate-400 opacity-30 font-medium pointer-events-none select-none tracking-wider">
              製作人-翁鵬翔
            </div>
          </section>

        </main>

        <footer className="mt-8 pb-12 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-100">
            <AlertCircle size={14} className="text-orange-400" />
            <p className="text-[11px] font-medium tracking-wide">
              僅提供外勤同仁試算，實際數字依人事單位報表為準
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
