import { useState, useRef, DragEvent } from 'react';
import { Copy, Check, Trash2, FileUp, Binary, Download, Eye } from 'lucide-react';

export default function Base64Tool() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isUrlSafe, setIsUrlSafe] = useState<boolean>(false);
  const [charset, setCharset] = useState<'utf8' | 'ascii'>('utf8');
  
  // File upload state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDataUriCopied, setIsDataUriCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadOutput = () => {
    if (!outputText) return;
    try {
      const isEncode = activeTab === 'encode';
      const extension = isEncode ? 'b64' : 'txt';
      let name = isEncode ? 'encoded-payload' : 'decoded-text';
      
      if (fileName) {
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        name = isEncode ? `${baseName}.b64` : baseName;
      }
      
      const mimeType = isEncode ? 'text/plain' : 'text/plain;charset=utf-8';
      const blob = new Blob([outputText], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name.endsWith(`.${extension}`) ? name : `${name}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    }
  };

  // Convert text string to Base64
  const encodeText = (text: string) => {
    try {
      if (!text) {
        setOutputText('');
        setError(null);
        return;
      }
      setError(null);
      let b64 = '';

      if (charset === 'utf8') {
        // Correct UTF-8 string encoding support
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        b64 = btoa(binString);
      } else {
        b64 = btoa(text);
      }

      if (isUrlSafe) {
        b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      setOutputText(b64);
    } catch (err: any) {
      setError(`Encoding Error: ${err.message || 'Make sure characters are compatible with the selected charset.'}`);
      setOutputText('');
    }
  };

  // Convert Base64 back to raw text
  const decodeText = (b64: string) => {
    try {
      if (!b64) {
        setOutputText('');
        setError(null);
        return;
      }
      setError(null);
      let cleanedB64 = b64.trim();
      
      // Standardize URL Safe Base64 for decoding
      cleanedB64 = cleanedB64.replace(/-/g, '+').replace(/_/g, '/');
      while (cleanedB64.length % 4) {
        cleanedB64 += '=';
      }

      const binString = atob(cleanedB64);
      
      if (charset === 'utf8') {
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        setOutputText(new TextDecoder().decode(bytes));
      } else {
        setOutputText(binString);
      }
    } catch (err: any) {
      setError(`Decoding Error: Invalid Base64 data. ${err.message}`);
      setOutputText('');
    }
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    setFileName(null); // Clear active file encoding if text changes
    if (activeTab === 'encode') {
      encodeText(val);
    } else {
      decodeText(val);
    }
  };

  const handleCharsetToggle = (selected: 'utf8' | 'ascii') => {
    setCharset(selected);
    // Trigger update with new charset
    setTimeout(() => {
      if (activeTab === 'encode') {
        encodeText(inputText);
      } else {
        decodeText(inputText);
      }
    }, 0);
  };

  const handleUrlSafeToggle = () => {
    const nextVal = !isUrlSafe;
    setIsUrlSafe(nextVal);
    // Apply changes instantly
    setTimeout(() => {
      if (activeTab === 'encode') {
        if (nextVal) {
          setOutputText(prev => prev.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
        } else {
          // Re-encode fully
          encodeText(inputText);
        }
      }
    }, 0);
  };

  // Read binary files and convert to Base64
  const processFile = (file: File) => {
    const reader = new FileReader();
    setFileName(file.name);
    setFileType(file.type || 'application/octet-stream');
    
    // Formatting size
    const sizeInKb = file.size / 1024;
    setFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(2)} MB` : `${sizeInKb.toFixed(1)} KB`);

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Extract raw Base64 from dataURL
        const commaIdx = result.indexOf(',');
        const rawB64 = result.substring(commaIdx + 1);
        
        let formattedB64 = rawB64;
        if (isUrlSafe) {
          formattedB64 = formattedB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }

        setInputText(`[File Raw Bytes: ${file.name}]`);
        setOutputText(formattedB64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      processFile(fileInputRef.current.files[0]);
    }
  };

  // Recover base64 as actual binary file downloads
  const handleDownloadFile = () => {
    try {
      let cleanedB64 = inputText.trim();
      cleanedB64 = cleanedB64.replace(/-/g, '+').replace(/_/g, '/');
      while (cleanedB64.length % 4) {
        cleanedB64 += '=';
      }

      const binString = atob(cleanedB64);
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
      }

      // Try parsing file structure or default to octet-stream
      const detectedMime = fileType || 'application/octet-stream';
      const blob = new Blob([bytes], { type: detectedMime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'decoded-raw-file.bin';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Cannot construct file payload: ${err.message}`);
    }
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setFileName(null);
    setFileSize(null);
    setFileType(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <Binary className="w-4 h-4 text-white" />
            BASE64_CODEC_ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Transform binary files, text strings, and certificates into secure local Base64 output.
          </p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-none">
          <button
            onClick={() => {
              setActiveTab('encode');
              clearAll();
            }}
            className={`px-4 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'encode'
                ? 'bg-zinc-800 border border-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ENCODE_RAW
          </button>
          <button
            onClick={() => {
              setActiveTab('decode');
              clearAll();
            }}
            className={`px-4 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'decode'
                ? 'bg-zinc-800 border border-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            DECODE_BASE64
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Input controls & payload areas */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {activeTab === 'encode' ? 'RAW_STRING_STREAM' : 'BASE64_CODE_STREAM'}
              </span>
              <button
                onClick={clearAll}
                className="text-[10px] text-zinc-500 hover:text-white transition flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
              >
                <Trash2 className="w-3" /> Clear
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={
                activeTab === 'encode'
                  ? 'Type or paste raw string characters to encode...'
                  : 'Paste a valid Base64 string to translate back...'
              }
              disabled={fileName !== null && activeTab === 'encode'}
              className="w-full h-64 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none rounded-none disabled:bg-zinc-950/40 disabled:text-zinc-600"
              spellCheck="false"
            />
          </div>

          {/* Config options */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Codec configuration</h3>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Charset:</span>
                <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-none">
                  <button
                    onClick={() => handleCharsetToggle('utf8')}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      charset === 'utf8' ? 'bg-zinc-800 text-white' : 'text-zinc-600'
                    }`}
                  >
                    UTF-8
                  </button>
                  <button
                    onClick={() => handleCharsetToggle('ascii')}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      charset === 'ascii' ? 'bg-zinc-800 text-white' : 'text-zinc-600'
                    }`}
                  >
                    ASCII
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrlSafe}
                  onChange={handleUrlSafeToggle}
                  className="rounded-none border-zinc-800 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-white"
                />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">URL-Safe format (- / _)</span>
              </label>
            </div>
          </div>

          {/* Drag and Drop File zone - ENCODE tab ONLY */}
          {activeTab === 'encode' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-white bg-zinc-900'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileUp className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                DRAG & DROP BINARY DATA
              </p>
              <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider">
                Raw images, signatures, configs (Transformed instantly to client state Base64)
              </p>
            </div>
          )}

          {/* Decoded File Recovery - DECODE tab ONLY */}
          {activeTab === 'decode' && inputText.trim() && !error && (
            <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-white" /> EXPORT DECODED RAW PAYLOAD
              </h4>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide leading-relaxed">
                If base64 contains compiled binary data, specify extension below to fetch local file.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  placeholder="raw-payload.bin"
                  value={fileName || ''}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-none text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleDownloadFile}
                  className="bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-none transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> DOWNLOAD_FILE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Formatted Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {activeTab === 'encode' ? 'BASE64_STRING_OUTPUT' : 'RAW_TEXT_OUTPUT'}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY_RESULT</span>
                  </>
                )}
              </button>
              <span className="text-zinc-850 select-none">|</span>
              <button
                onClick={handleDownloadOutput}
                disabled={!outputText}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD_OUTPUT</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={outputText}
              readOnly
              placeholder={
                activeTab === 'encode'
                  ? 'Base64 compiled string will show here...'
                  : 'Normal text decode representation will show here...'
              }
              className="w-full h-80 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none rounded-none resize-none"
              spellCheck="false"
            />
          </div>

          {/* Active Encoded File Meta */}
          {fileName && activeTab === 'encode' && (
            <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-zinc-800 rounded-none border border-zinc-700">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white">{fileName}</h4>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    {fileSize} • {fileType}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => {
                    if (outputText) {
                      const dataUri = `data:${fileType};base64,${outputText}`;
                      navigator.clipboard.writeText(dataUri);
                      setIsDataUriCopied(true);
                      setTimeout(() => setIsDataUriCopied(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-black rounded-none text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  {isDataUriCopied ? 'DATA_URI_COPIED' : 'COPY_DATA_URI'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-zinc-900 border border-rose-500/30 rounded-none">
              <p className="text-[10px] uppercase font-bold text-rose-400">Syntax decoder exception</p>
              <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mt-1 break-all">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
