import { useState, useEffect } from 'react';
import { Calendar, Copy, Check, Clock, AlertCircle, ArrowRightLeft, Download } from 'lucide-react';

export default function TimestampTool() {
  const [now, setNow] = useState<Date>(new Date());
  
  // Converter States: Epoch to Date
  const [epochInput, setEpochInput] = useState<string>('1784195186');
  const [epochResult, setEpochResult] = useState<any>(null);
  
  // Converter States: Date to Epoch
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(7);
  const [day, setDay] = useState<number>(15);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [second, setSecond] = useState<number>(0);
  const [timezoneMode, setTimezoneMode] = useState<'local' | 'utc'>('local');
  const [dateToEpochResult, setDateToEpochResult] = useState<{ sec: number; ms: number } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [epochError, setEpochError] = useState<string | null>(null);

  // Tick current time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update conversions
  useEffect(() => {
    handleEpochToDate();
  }, [epochInput]);

  useEffect(() => {
    handleDateToEpoch();
  }, [year, month, day, hour, minute, second, timezoneMode]);

  const handleEpochToDate = () => {
    setEpochError(null);
    if (!epochInput.trim()) {
      setEpochResult(null);
      return;
    }

    try {
      const val = Number(epochInput.trim());
      if (isNaN(val)) {
        throw new Error('Please enter a valid numeric value.');
      }

      // Detect Seconds vs Milliseconds vs Micro/Nanoseconds
      let date: Date;
      let unit = 'seconds';
      
      if (epochInput.trim().length <= 11) {
        // Seconds
        date = new Date(val * 1000);
        unit = 'seconds';
      } else if (epochInput.trim().length <= 14) {
        // Milliseconds
        date = new Date(val);
        unit = 'milliseconds';
      } else {
        // Micro/Nanoseconds - trim to milliseconds
        date = new Date(Math.floor(val / 1000000));
        unit = 'microseconds/nanoseconds (truncated to ms)';
      }

      if (isNaN(date.getTime())) {
        throw new Error('Date is out of valid Unix range.');
      }

      // Calculate relative time-ago or future
      const relative = getRelativeTime(date);

      // Check if Leap Year
      const y = date.getUTCFullYear();
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

      setEpochResult({
        utc: date.toUTCString(),
        local: date.toString(),
        iso: date.toISOString(),
        relative,
        unit,
        isLeap,
        dayOfYear: getDayOfYear(date)
      });
    } catch (err: any) {
      setEpochError(err.message || 'Conversion error');
      setEpochResult(null);
    }
  };

  const handleDateToEpoch = () => {
    try {
      let date: Date;
      if (timezoneMode === 'utc') {
        date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      } else {
        date = new Date(year, month - 1, day, hour, minute, second);
      }

      const ms = date.getTime();
      const sec = Math.floor(ms / 1000);

      if (isNaN(ms)) {
        setDateToEpochResult(null);
      } else {
        setDateToEpochResult({ sec, ms });
      }
    } catch {
      setDateToEpochResult(null);
    }
  };

  const handleSetDateToCurrent = () => {
    const cur = new Date();
    setYear(cur.getFullYear());
    setMonth(cur.getMonth() + 1);
    setDay(cur.getDate());
    setHour(cur.getHours());
    setMinute(cur.getMinutes());
    setSecond(cur.getSeconds());
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime() + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const getRelativeTime = (date: Date): string => {
    const delta = Math.round((date.getTime() - new Date().getTime()) / 1000);
    const isFuture = delta > 0;
    const absDelta = Math.abs(delta);

    if (absDelta < 60) {
      return isFuture ? 'in a few seconds' : 'just now';
    }

    const minutes = Math.floor(absDelta / 60);
    if (minutes < 60) {
      return isFuture ? `in ${minutes} mins` : `${minutes} mins ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return isFuture ? `in ${hours} hours` : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return isFuture ? `in ${days} days` : `${days} days ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return isFuture ? `in ${months} months` : `${months} months ago`;
    }

    const years = Math.floor(months / 12);
    return isFuture ? `in ${years} years` : `${years} years ago`;
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadReport = () => {
    let reportText = `==================================================
UTYLITIRAW TIME & EPOCH CONVERSION REPORT
Generated: ${now.toISOString()} / ${now.toUTCString()}
==================================================

`;

    if (epochResult) {
      reportText += `1. EPOCH TO DATETIME CONVERSION RESULT:
--------------------------------------------------
Input Epoch Value: ${epochInput}
Detected Unit:     ${epochResult.unit}

Converted Formats:
- ISO 8601 String:   ${epochResult.iso}
- UTC (GMT) Time:    ${epochResult.utc}
- Local Time:        ${epochResult.local}
- Relative:          ${epochResult.relative}
- Day Of Year:       ${epochResult.dayOfYear}
- Is Leap Year:      ${epochResult.isLeap ? 'Yes' : 'No'}

`;
    }

    if (dateToEpochResult) {
      reportText += `2. DATETIME TO EPOCH CONVERSION RESULT:
--------------------------------------------------
Input Calendar Date: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} (${timezoneMode.toUpperCase()})

Calculated Epoch Offsets:
- Epoch Seconds:      ${dateToEpochResult.sec}
- Epoch Milliseconds: ${dateToEpochResult.ms}

`;
    }

    reportText += `==================================================
RAW_UTILITY_EPOCH_ENGINE
==================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epoch-conversion-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSeconds = Math.floor(now.getTime() / 1000);
  const currentMs = now.getTime();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            EPOCH_UNIX_TIMESTAMP_CONVERTER
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Convert Unix epoch offsets back to localized datetime values and generate raw integer seeds.
          </p>
        </div>
        <div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-none text-[10px] uppercase tracking-wider font-black transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            DOWNLOAD_REPORT
          </button>
        </div>
      </div>

      {/* Live Counter Widget */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-none p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-950 text-white rounded-none border border-zinc-800">
            <Clock className="w-5 h-5 animate-pulse text-zinc-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">LIVE_UTC_STREAM</span>
            <span className="text-xs text-zinc-300 font-medium font-mono">
              {now.toUTCString()}
            </span>
          </div>
        </div>

        {/* Current Epoch Sec */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-none flex items-center justify-between">
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">EPOCH_SECONDS</span>
            <span className="text-sm font-bold text-zinc-200 font-mono tracking-wide">{currentSeconds}</span>
          </div>
          <button
            onClick={() => handleCopy(String(currentSeconds), 'sec')}
            className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-none transition cursor-pointer"
          >
            {copiedKey === 'sec' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Current Epoch Ms */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-none flex items-center justify-between">
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">EPOCH_MILLISECONDS</span>
            <span className="text-sm font-bold text-zinc-200 font-mono tracking-wide">{currentMs}</span>
          </div>
          <button
            onClick={() => handleCopy(String(currentMs), 'ms')}
            className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-none transition cursor-pointer"
          >
            {copiedKey === 'ms' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Epoch to Date */}
        <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <h3 className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">CONVERT_EPOCH_TO_DATE</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
              Epoch Timestamp Value
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                placeholder="e.g. 1784195186"
                className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => setEpochInput(String(Math.floor(Date.now() / 1000)))}
                className="px-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 rounded-none text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              >
                USE_NOW
              </button>
            </div>
          </div>

          {epochResult ? (
            <div className="space-y-3.5 pt-1.5">
              <div className="bg-zinc-950 p-2.5 rounded-none border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">DETECTED_UNIT</span>
                <span className="text-xs text-zinc-300 font-medium font-mono uppercase">{epochResult.unit}</span>
              </div>

              {[
                { label: 'UTC_GMT_TIMEZONE', val: epochResult.utc, key: 'utc' },
                { label: 'LOCAL_TIMEZONE', val: epochResult.local, key: 'local' },
                { label: 'ISO_8601_STRING', val: epochResult.iso, key: 'iso' }
              ].map((item) => (
                <div key={item.key} className="bg-zinc-950 p-2.5 rounded-none border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">{item.label}</span>
                    <span className="text-xs text-zinc-300 font-medium font-mono break-all pr-4">{item.val}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.val, item.key)}
                    className="text-zinc-500 hover:text-white transition shrink-0 cursor-pointer"
                  >
                    {copiedKey === item.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-950 p-2 rounded-none border border-zinc-800 text-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">RELATIVE</span>
                  <span className="text-xs font-semibold text-zinc-300 block mt-0.5 uppercase">{epochResult.relative}</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded-none border border-zinc-800 text-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">DAY_OF_YEAR</span>
                  <span className="text-xs font-semibold text-zinc-300 block mt-0.5 font-mono">{epochResult.dayOfYear}</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded-none border border-zinc-800 text-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block">LEAP_YEAR</span>
                  <span className="text-xs font-semibold text-zinc-300 block mt-0.5 uppercase">{epochResult.isLeap ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          ) : epochError ? (
            <div className="p-3.5 bg-zinc-950 border border-rose-500/30 rounded-none flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span className="text-xs font-medium font-mono">{epochError}</span>
            </div>
          ) : null}
        </div>

        {/* Right Card: Date to Epoch */}
        <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
            <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
            <h3 className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">CONVERT_DATE_TO_EPOCH</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Month</label>
              <input
                type="number"
                value={month}
                min={1}
                max={12}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Day</label>
              <input
                type="number"
                value={day}
                min={1}
                max={31}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Hour (24h)</label>
              <input
                type="number"
                value={hour}
                min={0}
                max={23}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Minute</label>
              <input
                type="number"
                value={minute}
                min={0}
                max={59}
                onChange={(e) => setMinute(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Second</label>
              <input
                type="number"
                value={second}
                min={0}
                max={59}
                onChange={(e) => setSecond(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-none">
              <button
                onClick={() => setTimezoneMode('local')}
                className={`px-3 py-1 rounded-none text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                  timezoneMode === 'local' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                LOCAL
              </button>
              <button
                onClick={() => setTimezoneMode('utc')}
                className={`px-3 py-1 rounded-none text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                  timezoneMode === 'utc' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                UTC
              </button>
            </div>

            <button
              onClick={handleSetDateToCurrent}
              className="text-[9px] text-zinc-500 hover:text-white uppercase tracking-wider font-bold transition cursor-pointer"
            >
              FILL_CURRENT_VALUES
            </button>
          </div>

          {dateToEpochResult ? (
            <div className="space-y-3 pt-2 select-all">
              <div className="bg-zinc-950 p-3 rounded-none border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">EPOCH_SECONDS</span>
                  <span className="text-sm font-bold text-zinc-300 font-mono">{dateToEpochResult.sec}</span>
                </div>
                <button
                  onClick={() => handleCopy(String(dateToEpochResult.sec), 'result-sec')}
                  className="text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  {copiedKey === 'result-sec' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-zinc-950 p-3 rounded-none border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">EPOCH_MILLISECONDS</span>
                  <span className="text-sm font-bold text-zinc-300 font-mono">{dateToEpochResult.ms}</span>
                </div>
                <button
                  onClick={() => handleCopy(String(dateToEpochResult.ms), 'result-ms')}
                  className="text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  {copiedKey === 'result-ms' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
