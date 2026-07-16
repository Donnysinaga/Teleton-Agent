import { useState, useEffect } from 'react';
import { Eye, Copy, Check, Info, FileCode, Search, Download } from 'lucide-react';

export default function HexTool() {
  const [input, setInput] = useState<string>('Raw hex viewer is a perfect utility for inspecting bytes!\nZero-width spaces or hidden carriage returns (\\r\\n) can be found here easily.');
  const [hexRows, setHexRows] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [copyType, setCopyType] = useState<'hex' | 'dump'>('hex');

  useEffect(() => {
    generateHexDump();
  }, [input]);

  const generateHexDump = () => {
    // Convert string input to UTF-8 raw bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    
    const rows = [];
    const bytesPerLine = 16;
    
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
      const lineBytes = [];
      
      for (let j = 0; j < bytesPerLine; j++) {
        const byteIndex = i + j;
        if (byteIndex < bytes.length) {
          const byte = bytes[byteIndex];
          // Hex string conversion
          const hex = byte.toString(16).padStart(2, '0').toUpperCase();
          // ASCII character inspection
          const char = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
          
          lineBytes.push({
            byte,
            hex,
            index: byteIndex,
            ascii: char
          });
        } else {
          // Empty padding bytes for formatting
          lineBytes.push(null);
        }
      }
      
      rows.push({
        offset: i.toString(16).padStart(8, '0').toUpperCase(),
        bytes: lineBytes
      });
    }
    setHexRows(rows);
  };

  const handleCopyHex = (type: 'hex' | 'dump') => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    
    if (type === 'hex') {
      const hexString = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      navigator.clipboard.writeText(hexString);
    } else {
      // Copy entire dump text format
      let dump = '';
      hexRows.forEach(row => {
        const hexParts = row.bytes.map((b: any) => b ? b.hex : '  ').join(' ');
        const asciiParts = row.bytes.map((b: any) => b ? b.ascii : ' ').join('');
        dump += `${row.offset}  ${hexParts.padEnd(47, ' ')}  |${asciiParts}|\n`;
      });
      navigator.clipboard.writeText(dump);
    }
    
    setCopyType(type);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadHex = (type: 'hex' | 'dump') => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    let content = '';
    let filename = '';
    
    if (type === 'hex') {
      content = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      filename = 'hex-bytes.txt';
    } else {
      hexRows.forEach(row => {
        const hexParts = row.bytes.map((b: any) => b ? b.hex : '  ').join(' ');
        const asciiParts = row.bytes.map((b: any) => b ? b.ascii : ' ').join('');
        content += `${row.offset}  ${hexParts.padEnd(47, ' ')}  |${asciiParts}|\n`;
      });
      filename = 'hex-dump.txt';
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Match search highlights
  const isByteHighlighted = (byteObj: any) => {
    if (!byteObj) return false;
    if (!searchQuery) return false;
    
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    
    // Search in raw character, hex value, or index
    return (
      byteObj.hex.toLowerCase().includes(q) ||
      byteObj.ascii.toLowerCase().includes(q) ||
      byteObj.byte.toString().includes(q)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <FileCode className="w-4 h-4 text-white" />
            HEX_DUMP_ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Examine exact bytecode layouts, offset coordinates, and raw ascii streams.
          </p>
        </div>
        
        {/* Copy & Download Options */}
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-none items-center gap-1">
            <button
              onClick={() => handleCopyHex('hex')}
              className="flex items-center gap-1 px-2.5 py-1 text-zinc-300 hover:text-white rounded-none text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              title="Copy hex bytes to clipboard"
            >
              {isCopied && copyType === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              COPY_HEX
            </button>
            <span className="text-zinc-800 text-[10px]">|</span>
            <button
              onClick={() => handleDownloadHex('hex')}
              className="flex items-center gap-1 px-2 py-1 text-zinc-400 hover:text-white rounded-none text-[10px] uppercase font-bold transition cursor-pointer"
              title="Download raw hex bytes as text file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-none items-center gap-1">
            <button
              onClick={() => handleCopyHex('dump')}
              className="flex items-center gap-1 px-2.5 py-1 text-zinc-300 hover:text-white rounded-none text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              title="Copy full formatted hex dump to clipboard"
            >
              {isCopied && copyType === 'dump' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              COPY_DUMP
            </button>
            <span className="text-zinc-800 text-[10px]">|</span>
            <button
              onClick={() => handleDownloadHex('dump')}
              className="flex items-center gap-1 px-2 py-1 text-zinc-400 hover:text-white rounded-none text-[10px] uppercase font-bold transition cursor-pointer"
              title="Download formatted hex dump as text file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Area - 4 cols */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex flex-col">
            <div className="bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                RAW_TEXT_SOURCE
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type characters here to watch their binary hex representation compile in real-time..."
              className="w-full h-72 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none rounded-none"
              spellCheck="false"
            />
          </div>

          {/* Quick Stats & Byte Count */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-white" /> BYTE_METRIC_REPORT
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-none text-center">
                <span className="text-[9px] text-zinc-500 block uppercase">Byte Length</span>
                <span className="text-sm font-bold text-white font-mono">
                  {new TextEncoder().encode(input).length} BYTES
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-none text-center">
                <span className="text-[9px] text-zinc-500 block uppercase">Rows</span>
                <span className="text-sm font-bold text-white font-mono">
                  {hexRows.length} ROWS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Area - 8 cols */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Hex Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Highlight bytes by Hex value, ASCII, or Byte code (e.g. 48, W, 255)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-none pl-9 pr-4 py-2 text-xs text-zinc-300 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-0"
            />
          </div>

          <div className="border border-zinc-850 rounded-none overflow-hidden bg-zinc-950">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-1 bg-zinc-900 border-b border-zinc-800 py-2 px-4 select-none text-[9px] font-bold text-zinc-400 font-mono">
              <div className="col-span-2">OFFSET</div>
              <div className="col-span-7 text-center">HEXADECIMAL BYTES</div>
              <div className="col-span-3 text-right font-mono">ASCII DECODE</div>
            </div>

            {/* Scrollable Hex Dump Grid */}
            <div className="p-4 overflow-y-auto max-h-[380px] custom-scrollbar space-y-1 bg-zinc-950 font-mono text-xs">
              {hexRows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-12 gap-1 items-center hover:bg-zinc-900/40 rounded-none transition">
                  {/* Offset Header */}
                  <div className="col-span-2 text-white font-black select-none">
                    {row.offset}
                  </div>

                  {/* 16 Hex Bytes */}
                  <div className="col-span-7 flex flex-wrap gap-1 justify-center">
                    {row.bytes.map((byteObj: any, bIdx: number) => {
                      if (!byteObj) {
                        return <span key={bIdx} className="w-5 text-center text-transparent select-none">..</span>;
                      }
                      const isHovered = hoveredIndex === byteObj.index;
                      const isHighlighted = isByteHighlighted(byteObj);
                      return (
                        <span
                          key={bIdx}
                          onMouseEnter={() => setHoveredIndex(byteObj.index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`w-5 text-center cursor-help rounded-none text-[11px] transition-all select-none ${
                            isHovered
                              ? 'bg-white text-black font-black scale-110 shadow'
                              : isHighlighted
                              ? 'bg-zinc-800 text-white border border-zinc-600'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >
                          {byteObj.hex}
                        </span>
                      );
                    })}
                  </div>

                  {/* ASCII preview */}
                  <div className="col-span-3 text-right select-none pr-1 tracking-wider">
                    {row.bytes.map((byteObj: any, bIdx: number) => {
                      if (!byteObj) {
                        return <span key={bIdx} className="text-transparent"> </span>;
                      }
                      const isHovered = hoveredIndex === byteObj.index;
                      const isHighlighted = isByteHighlighted(byteObj);
                      return (
                        <span
                          key={bIdx}
                          onMouseEnter={() => setHoveredIndex(byteObj.index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`inline-block px-0.5 rounded-none cursor-help ${
                            isHovered
                              ? 'bg-white text-black font-black'
                              : isHighlighted
                              ? 'bg-zinc-800 text-white font-bold'
                              : 'text-zinc-600 hover:text-white'
                          }`}
                        >
                          {byteObj.ascii}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              {hexRows.length === 0 && (
                <div className="text-center py-12 text-zinc-600">
                  <Eye className="w-6 h-6 mx-auto mb-2 opacity-50 text-zinc-500" />
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Awaiting user input streams</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
