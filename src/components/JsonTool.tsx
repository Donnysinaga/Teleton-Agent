import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Code, ShieldAlert, Sparkles, FolderTree, FileJson, Download } from 'lucide-react';

export default function JsonTool() {
  const [input, setInput] = useState<string>('{\n  "status": "success",\n  "data": {\n    "id": 10834,\n    "title": "Raw Data Log",\n    "active": true,\n    "tags": ["raw", "utility", "developer"],\n    "meta": {\n      "timestamp": 1784195186,\n      "origin_ip": "192.168.1.50"\n    }\n  }\n}');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    handleValidate(false);
  }, [input]);

  const handleFormat = (spaces: number | string) => {
    try {
      setError(null);
      const parsed = JSON.parse(input);
      const indent = spaces === 'tab' ? '\t' : Number(spaces);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setParsedJson(parsed);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setOutput('');
      setParsedJson(null);
    }
  };

  const handleMinify = () => {
    try {
      setError(null);
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setParsedJson(parsed);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setOutput('');
      setParsedJson(null);
    }
  };

  const handleValidate = (showSuccessAlert = true) => {
    if (!input.trim()) {
      setError(null);
      setOutput('');
      setParsedJson(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setParsedJson(parsed);
      setError(null);
      if (showSuccessAlert) {
        setOutput(JSON.stringify(parsed, null, 2));
      }
    } catch (err: any) {
      setError(err.message || 'Syntax Error');
      setParsedJson(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output || input);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    let jsonStr = output;
    if (!jsonStr && input.trim()) {
      try {
        jsonStr = JSON.stringify(JSON.parse(input), null, 2);
      } catch {
        jsonStr = input;
      }
    }
    if (!jsonStr) return;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted-payload.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-fix typical broken JSON from raw log files (single quotes, trailing commas, missing braces, etc.)
  const handleAutoFix = () => {
    let raw = input.trim();
    if (!raw) return;

    try {
      // 1. Convert single quotes surrounding keys/values to double quotes
      // Be careful not to break valid single quotes inside values
      // A simple regex approach for key-value styling:
      raw = raw.replace(/,\s*([\]}])/g, '$1'); // Trailing commas
      raw = raw.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"'); // Single quotes to double quotes

      // 2. Fix unquoted keys
      raw = raw.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

      // 3. Wrap with braces if missing
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        raw = '{' + raw + '}';
      }

      const parsed = JSON.parse(raw);
      setInput(JSON.stringify(parsed, null, 2));
      setError(null);
      setParsedJson(parsed);
    } catch (err: any) {
      // If simple regex fails, alert user with a more direct warning
      setError(`Auto-fix could not repair this JSON fully. Error: ${err.message}`);
    }
  };

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Custom Recursive JSON Tree View Renderer
  const renderJsonTree = (data: any, path = 'root', depth = 0) => {
    const type = typeof data;

    if (data === null) {
      return <span className="text-rose-400 font-mono">null</span>;
    }

    if (type === 'boolean') {
      return <span className="text-amber-400 font-mono">{data ? 'true' : 'false'}</span>;
    }

    if (type === 'number') {
      return <span className="text-sky-400 font-mono">{data}</span>;
    }

    if (type === 'string') {
      return <span className="text-emerald-400 font-mono">"{data}"</span>;
    }

    const isArray = Array.isArray(data);
    const keys = isArray ? data : Object.keys(data);
    const isExpanded = expandedNodes[path] !== false; // Default expanded

    if (keys.length === 0) {
      return <span className="text-zinc-500 font-mono">{isArray ? '[]' : '{}'}</span>;
    }

    return (
      <div className="pl-4 border-l border-zinc-800 font-mono text-sm">
        <button
          onClick={() => toggleNode(path)}
          className="text-zinc-500 hover:text-zinc-300 font-semibold text-xs py-1 select-none focus:outline-none"
        >
          {isExpanded ? '▼' : '▶'} {isArray ? `Array [${keys.length}]` : `Object {${keys.length}}`}
        </button>

        {isExpanded && (
          <div className="space-y-1 mt-1">
            {isArray ? (
              (data as any[]).map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-zinc-500 mr-2 select-none">{index}:</span>
                  {renderJsonTree(item, `${path}[${index}]`, depth + 1)}
                </div>
              ))
            ) : (
              Object.entries(data).map(([key, val]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-start">
                  <span className="text-zinc-400 font-medium mr-2 select-none">"{key}":</span>
                  <div>{renderJsonTree(val, `${path}.${key}`, depth + 1)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <FileJson className="w-4 h-4 text-white" />
            JSON_PARSER_ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Parse, validate, repair, and explore raw text JSON payloads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAutoFix}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-none text-[11px] uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer font-bold"
            title="Attempts to fix missing quotes, stray commas, and incorrect braces"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Auto-Fix JSON
          </button>
          <button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
              setParsedJson(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-none text-[11px] uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-600" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-3.5 h-3.5" /> RAW_INPUT_STREAM
            </span>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">
              {input.length} BYTE_SIZE
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your raw, messy, or unformatted JSON here..."
            className="w-full h-80 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none rounded-none"
            spellCheck="false"
          />
          {/* Format controls directly below Input */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/40 border border-t-0 border-zinc-800 rounded-none px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleFormat(2)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] uppercase tracking-wider transition cursor-pointer font-bold"
              >
                2_SPACES
              </button>
              <button
                onClick={() => handleFormat(4)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] uppercase tracking-wider transition cursor-pointer font-bold"
              >
                4_SPACES
              </button>
              <button
                onClick={() => handleFormat('tab')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] uppercase tracking-wider transition cursor-pointer font-bold"
              >
                TABS
              </button>
              <button
                onClick={handleMinify}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] uppercase tracking-wider transition cursor-pointer font-bold"
              >
                MINIFY
              </button>
            </div>
            <button
              onClick={() => handleValidate(true)}
              className="px-3 py-1 bg-white hover:bg-zinc-200 text-black rounded-none text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer"
            >
              RUN_FORMAT
            </button>
          </div>

          {/* Validation Banner */}
          {error ? (
            <div className="mt-4 p-3 bg-zinc-900 border border-rose-500/30 rounded-none flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-rose-400">SYNTAX_ERROR</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-1 break-all leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          ) : input.trim() ? (
            <div className="mt-4 p-3 bg-zinc-900/30 border border-emerald-500/20 rounded-none flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">STATUS_VALID_JSON</span>
            </div>
          ) : null}
        </div>

        {/* Output Panel / Tree View */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5" /> PRETTIFIED_TREE_EXPLORER
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!output && !input}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY_RAW</span>
                  </>
                )}
              </button>
              <span className="text-zinc-850 select-none">|</span>
              <button
                onClick={handleDownload}
                disabled={!output && !input}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD_JSON</span>
              </button>
            </div>
          </div>

          {parsedJson ? (
            <div className="border border-zinc-800 rounded-none overflow-hidden flex flex-col h-[382px]">
              {/* Tab options for plain text vs raw explorer tree */}
              <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-2 py-1 items-center">
                <span className="text-[9px] font-bold text-zinc-600 px-3 py-1 select-none uppercase tracking-widest">VIEW MODE:</span>
                <span className="text-[9px] font-bold text-white bg-zinc-800 border border-zinc-700 rounded-none px-2 py-0.5">
                  NODE_TREE
                </span>
              </div>
              <div className="flex-1 overflow-auto bg-zinc-950 p-4 space-y-2 custom-scrollbar">
                {renderJsonTree(parsedJson)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[382px] bg-zinc-950 border border-zinc-800 rounded-none p-8 text-center text-zinc-500">
              <FileJson className="w-8 h-8 text-zinc-800 mb-3" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-600">No active tree view</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[240px] leading-relaxed uppercase">
                Enter valid JSON input or trigger validation to preview structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
