import { useState } from 'react';
import { Terminal, FileJson, Binary, FileCode, Fingerprint, Type, Clock } from 'lucide-react';
import { ToolId } from './types';
import JsonTool from './components/JsonTool';
import Base64Tool from './components/Base64Tool';
import HexTool from './components/HexTool';
import HashTool from './components/HashTool';
import TextTool from './components/TextTool';
import TimestampTool from './components/TimestampTool';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('json');

  const tools = [
    { id: 'json', name: 'JSON_PARSER', desc: 'Prettify & validate JSON', icon: FileJson, num: '01', color: 'text-zinc-100' },
    { id: 'base64', name: 'BASE64_ENCODE', desc: 'Encode / decode strings & files', icon: Binary, num: '02', color: 'text-zinc-100' },
    { id: 'hex', name: 'HEX_DUMP', desc: 'Interactive byte explorer', icon: FileCode, num: '03', color: 'text-zinc-100' },
    { id: 'hash', name: 'CRYPT_HASH', desc: 'MD5, SHA checksum engine', icon: Fingerprint, num: '04', color: 'text-zinc-100' },
    { id: 'text', name: 'TEXT_INSPECT', desc: 'Line tools, stats & regex', icon: Type, num: '05', color: 'text-zinc-100' },
    { id: 'timestamp', name: 'EPOCH_CONVERT', desc: 'Unix timestamp converter', icon: Clock, num: '06', color: 'text-zinc-100' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Centered Desktop Layout Wrapper */}
      <div className="w-full max-w-7xl mx-auto space-y-4">
        
        {/* Technical Utility Bar Header */}
        <header className="border border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-white"></div>
              <span className="font-black text-white tracking-tighter uppercase text-base">UTYLITI_RAW_V1.2</span>
            </div>
            <nav className="hidden md:flex gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              <span className="text-white select-none">File</span>
              <span className="hover:text-white cursor-pointer transition-colors select-none">Edit</span>
              <span className="hover:text-white cursor-pointer transition-colors select-none">View</span>
              <span className="hover:text-white cursor-pointer transition-colors select-none">Processes</span>
              <span className="hover:text-white cursor-pointer transition-colors select-none text-emerald-500">● Sandbox</span>
            </nav>
          </div>
          <div className="text-[10px] flex gap-5 font-mono text-zinc-500">
            <span className="italic">LATENCY: 12ms</span>
            <span className="italic">UPTIME: 104:12:09</span>
            <span className="text-zinc-400 font-bold uppercase">SECURE_SSL</span>
          </div>
        </header>

        {/* Responsive Core Tool Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 select-none">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as ToolId)}
                className={`p-3.5 border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                  active
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-lg'
                    : 'bg-zinc-900/20 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-1 ${active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] border px-1.5 py-0.5 font-bold transition-colors ${
                    active ? 'border-zinc-400 text-white' : 'border-zinc-800 text-zinc-600 group-hover:text-zinc-500'
                  }`}>
                    {t.num}
                  </span>
                </div>
                
                <div>
                  <h3 className={`text-[11px] font-bold tracking-wider transition-colors ${active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {t.name}
                  </h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug line-clamp-1">
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Control Strip above Work Area */}
        <div className="border border-zinc-800 bg-zinc-900/20 flex flex-wrap items-center px-6 py-2.5 gap-4 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500 uppercase font-bold tracking-wider">System_Online</span>
          </div>
          <div className="h-3.5 w-px bg-zinc-800"></div>
          <div className="flex gap-4 text-zinc-500">
            <span>ENCODING: UTF-8</span>
            <span>LF_CRLF: AUTO</span>
            <span>MEMORY_CACHE: SECURE</span>
          </div>
        </div>

        {/* Dynamic Workbench Workspace Window */}
        <div className="bg-zinc-900/10 border border-zinc-800 p-6 min-h-[480px]">
          {activeTool === 'json' && <JsonTool />}
          {activeTool === 'base64' && <Base64Tool />}
          {activeTool === 'hex' && <HexTool />}
          {activeTool === 'hash' && <HashTool />}
          {activeTool === 'text' && <TextTool />}
          {activeTool === 'timestamp' && <TimestampTool />}
        </div>
      </div>

      {/* Sophisticated Dark Technical Footer */}
      <footer className="w-full max-w-7xl mx-auto mt-8 border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-zinc-600 font-mono">
        <div className="flex gap-4">
          <span>CPU_CORE: 2.4%</span>
          <span>RAM_USAGE: 124MB</span>
          <span>SHARDS: ACTIVE</span>
        </div>
        <div className="flex gap-4 items-center">
          <span>RAW_UTILITY_V1.2-STABLE</span>
          <span className="text-zinc-400 font-black">LOCAL_SANDBOX</span>
        </div>
      </footer>
    </div>
  );
}

