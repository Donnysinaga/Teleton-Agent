import { useState, useEffect } from 'react';
import { Type, Copy, Check, Trash2, ListOrdered, Shuffle, AlignLeft, Search, Eye, AlertCircle, Download } from 'lucide-react';
import { TextStats } from '../types';

export default function TextTool() {
  const [input, setInput] = useState<string>(
    "Raw text inspectors are incredible for diagnosing UTF-8 payloads.\n\n" +
    "Let's see: some spaces, \t a couple of tabs, \n" +
    "and repeated lines.\n" +
    "and repeated lines."
  );
  const [output, setOutput] = useState<string>('');
  
  // Stats
  const [stats, setStats] = useState<TextStats>({
    characters: 0,
    bytes: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    whitespaces: 0
  });

  // Find & Replace
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [matchCase, setMatchCase] = useState<boolean>(true);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Hidden characters visualizer toggle
  const [showInvisibles, setShowInvisibles] = useState<boolean>(false);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    calculateStats();
    // Default output follows input unless transformed
    setOutput(input);
  }, [input]);

  const calculateStats = () => {
    if (!input) {
      setStats({ characters: 0, bytes: 0, words: 0, lines: 0, paragraphs: 0, whitespaces: 0 });
      return;
    }

    const chars = input.length;
    
    // Exact UTF-8 Byte Count computation
    const bytes = new TextEncoder().encode(input).length;
    
    const words = input.trim() === "" ? 0 : input.trim().split(/\s+/).length;
    
    const lines = input.split('\n').length;
    
    const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    
    const whitespaces = (input.match(/\s/g) || []).length;

    setStats({
      characters: chars,
      bytes,
      words,
      lines,
      paragraphs,
      whitespaces
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadOutput = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Line Processors
  const processLines = (operation: 'sort-asc' | 'sort-desc' | 'reverse' | 'dedup' | 'strip-empty' | 'add-numbers' | 'trim') => {
    const lines = input.split('\n');
    let processed: string[] = [];

    switch (operation) {
      case 'sort-asc':
        processed = [...lines].sort((a, b) => a.localeCompare(b));
        break;
      case 'sort-desc':
        processed = [...lines].sort((a, b) => b.localeCompare(a));
        break;
      case 'reverse':
        processed = [...lines].reverse();
        break;
      case 'dedup':
        processed = Array.from(new Set(lines));
        break;
      case 'strip-empty':
        processed = lines.filter(line => line.trim() !== '');
        break;
      case 'trim':
        processed = lines.map(line => line.trim());
        break;
      case 'add-numbers':
        processed = lines.map((line, idx) => `${String(idx + 1).padStart(3, '0')}  ${line}`);
        break;
    }

    setOutput(processed.join('\n'));
  };

  // Case Converters
  const convertCase = (mode: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab') => {
    if (!input) return;
    let converted = '';

    switch (mode) {
      case 'upper':
        converted = input.toUpperCase();
        break;
      case 'lower':
        converted = input.toLowerCase();
        break;
      case 'title':
        converted = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
        break;
      case 'camel':
        converted = input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        break;
      case 'snake':
        converted = input.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]+/g, '');
        break;
      case 'kebab':
        converted = input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]+/g, '');
        break;
    }

    setOutput(converted);
  };

  // Find & Replace
  const handleReplace = () => {
    if (!findText) return;
    setRegexError(null);

    try {
      let result = '';
      if (useRegex) {
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(findText, flags);
        result = input.replace(regex, replaceText);
      } else {
        if (matchCase) {
          result = input.split(findText).join(replaceText);
        } else {
          // Case-insensitive literal split-join
          const escapedFind = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(escapedFind, 'gi');
          result = input.replace(regex, replaceText);
        }
      }
      setOutput(result);
    } catch (err: any) {
      setRegexError(err.message || 'Invalid Regular Expression');
    }
  };

  // Renders a preview highlighting invisible/non-printable characters
  const renderInvisibleChars = (txt: string) => {
    return txt.split('\n').map((line, lineIdx) => {
      // Highlight: spaces, tabs, carriage returns, zero-width spaces
      const chars = Array.from(line);
      return (
        <div key={lineIdx} className="min-h-[18px] break-all leading-relaxed">
          {chars.length === 0 ? (
            <span className="text-zinc-650 select-none font-mono text-[10px]">↵\n</span>
          ) : (
            chars.map((char, charIdx) => {
              if (char === ' ') {
                return <span key={charIdx} className="text-zinc-550 select-none font-sans" title="Space">·</span>;
              }
              if (char === '\t') {
                return <span key={charIdx} className="text-zinc-400 bg-zinc-900 px-1 rounded-none select-none text-[10px] font-mono" title="Tab">→\t</span>;
              }
              if (char === '\r') {
                return <span key={charIdx} className="text-zinc-400 font-bold select-none text-[10px] font-mono" title="Carriage Return">\r</span>;
              }
              if (char === '\u200b') {
                return <span key={charIdx} className="bg-zinc-800 text-white px-1 rounded-none font-bold animate-pulse" title="Zero Width Space">ZWSP</span>;
              }
              return <span key={charIdx} className="text-zinc-350">{char}</span>;
            })
          )}
          {lineIdx < txt.split('\n').length - 1 && (
            <span className="text-zinc-750 select-none ml-1">↵</span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-white" />
            TEXT_TRANSFORM_ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Expose whitespace structure, calculate metrics, and execute precision find-replace operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Input + Controls (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                RAW_INPUT_TEXT
              </span>
              <button
                onClick={() => {
                  setInput('');
                  setOutput('');
                }}
                className="text-[10px] text-zinc-500 hover:text-white transition flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
              >
                <Trash2 className="w-3" /> CLEAR_INPUT
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw string characters to inspect..."
              className="w-full h-56 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none rounded-none"
              spellCheck="false"
            />
          </div>

          {/* Regex Find and Replace */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> REGEX_FIND_REPLACE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Find value..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    className="rounded-none border-zinc-800 bg-zinc-950 text-white focus:ring-0 w-3.5 h-3.5 accent-white"
                  />
                  <span className="text-zinc-400 font-medium">Use RegEx</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={(e) => setMatchCase(e.target.checked)}
                    className="rounded-none border-zinc-800 bg-zinc-950 text-white focus:ring-0 w-3.5 h-3.5 accent-white"
                  />
                  <span className="text-zinc-400 font-medium">Match Case</span>
                </label>
              </div>
              <button
                onClick={handleReplace}
                className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-none text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
              >
                EXECUTE_REPLACE
              </button>
            </div>
            {regexError && (
              <div className="p-2.5 bg-zinc-900 border border-rose-500/30 rounded-none flex items-center gap-2 text-rose-400 text-[10px] font-mono break-all">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {regexError}
              </div>
            )}
          </div>

          {/* Quick operations */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" /> BULK_OPERATIONS_SUITE
              </h3>
            </div>
            
            {/* Quick Cases Grid */}
            <div className="space-y-3">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Case Conversion</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'UPPERCASE', id: 'upper' },
                    { label: 'lowercase', id: 'lower' },
                    { label: 'Title Case', id: 'title' },
                    { label: 'camelCase', id: 'camel' },
                    { label: 'snake_case', id: 'snake' },
                    { label: 'kebab-case', id: 'kebab' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => convertCase(item.id as any)}
                      className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 rounded-none text-[10px] uppercase font-bold transition cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Processors */}
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Line Operations</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Sort A-Z', id: 'sort-asc' },
                    { label: 'Sort Z-A', id: 'sort-desc' },
                    { label: 'Reverse Lines', id: 'reverse' },
                    { label: 'Remove Duplicates', id: 'dedup' },
                    { label: 'Remove Empty Lines', id: 'strip-empty' },
                    { label: 'Trim Whitespaces', id: 'trim' },
                    { label: 'Add Line Numbers', id: 'add-numbers' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => processLines(item.id as any)}
                      className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 rounded-none text-[10px] uppercase font-bold transition cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Output (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Quick Metrics */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
              TEXT_METRICS_REPORT
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Characters', val: stats.characters },
                { label: 'UTF-8 Bytes', val: stats.bytes },
                { label: 'Words', val: stats.words },
                { label: 'Lines', val: stats.lines },
                { label: 'Paragraphs', val: stats.paragraphs },
                { label: 'Whitespaces', val: stats.whitespaces }
              ].map((m, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-none flex flex-col justify-center">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono font-bold">{m.label}</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Processed Output */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                PROCESSED_OUTPUT
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showInvisibles}
                    onChange={(e) => setShowInvisibles(e.target.checked)}
                    className="rounded-none border-zinc-800 bg-zinc-950 text-white focus:ring-0 w-3 h-3 accent-white"
                  />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">SHOW_WHITESPACES</span>
                </label>
                <div className="h-3 w-px bg-zinc-850 hidden sm:block"></div>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <span className="text-zinc-800 select-none">|</span>
                <button
                  onClick={handleDownloadOutput}
                  disabled={!output}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
                  title="Download processed text as text file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {showInvisibles ? (
              <div className="w-full h-64 bg-zinc-950 text-zinc-400 font-mono text-xs p-4 border border-zinc-800 rounded-none overflow-auto custom-scrollbar whitespace-pre select-all">
                {renderInvisibleChars(output)}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Transformed characters will reflect here..."
                className="w-full h-64 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none rounded-none resize-none"
                spellCheck="false"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
