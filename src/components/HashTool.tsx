import { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, Info, Fingerprint, RefreshCw, EqualNot, CheckCircle2, Download } from 'lucide-react';
import { md5, sha1, sha256, sha512 } from '../utils/crypto';

export default function HashTool() {
  const [input, setInput] = useState<string>('The quick brown fox jumps over the lazy dog');
  const [salt, setSalt] = useState<string>('');
  const [saltPosition, setSaltPosition] = useState<'prefix' | 'suffix'>('suffix');
  
  // Computed hashes state
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  // Verification state
  const [verifyHash, setVerifyHash] = useState<string>('');
  const [verifiedAlgorithm, setVerifiedAlgorithm] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    computeHashes();
  }, [input, salt, saltPosition]);

  useEffect(() => {
    // Re-evaluate verification when hashes or verification query changes
    const cleanVerify = verifyHash.trim().toLowerCase();
    if (!cleanVerify) {
      setVerifiedAlgorithm(null);
      return;
    }

    if (cleanVerify === hashes.md5.toLowerCase()) {
      setVerifiedAlgorithm('MD5');
    } else if (cleanVerify === hashes.sha1.toLowerCase()) {
      setVerifiedAlgorithm('SHA-1');
    } else if (cleanVerify === hashes.sha256.toLowerCase()) {
      setVerifiedAlgorithm('SHA-256');
    } else if (cleanVerify === hashes.sha512.toLowerCase()) {
      setVerifiedAlgorithm('SHA-512');
    } else {
      setVerifiedAlgorithm(null);
    }
  }, [verifyHash, hashes]);

  const computeHashes = async () => {
    let rawText = input;
    if (salt) {
      rawText = saltPosition === 'prefix' ? salt + input : input + salt;
    }

    // MD5 (sync)
    const md5Hash = md5(rawText);

    // SHA hashes (async)
    try {
      const s1 = await sha1(rawText);
      const s256 = await sha256(rawText);
      const s512 = await sha512(rawText);

      setHashes({
        md5: md5Hash,
        sha1: s1,
        sha256: s256,
        sha512: s512
      });
    } catch (err) {
      console.error('Hashing calculation error:', err);
    }
  };

  const handleCopy = (hashValue: string, algorithmName: string) => {
    navigator.clipboard.writeText(hashValue);
    setCopiedKey(algorithmName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadReport = () => {
    if (!input) return;
    const reportText = `==================================================
UTYLITIRAW HASH METRICS REPORT
Generated: ${new Date().toISOString()}
==================================================

RAW INPUT PAYLOAD:
"${input}"

CONFIGURATION:
Salt Key: ${salt ? `"${salt}"` : 'None'}
Salt Position: ${salt ? saltPosition.toUpperCase() : 'N/A'}

COMPUTED CHECKSUMS:
--------------------------------------------------
MD5:
${hashes.md5}

SHA-1:
${hashes.sha1}

SHA-256:
${hashes.sha256}

SHA-512:
${hashes.sha512}
==================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checksums-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-white" />
            HASH_CHECKSUM_ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Compute real-time hashes with signature salting and instant dictionary comparison.
          </p>
        </div>
        <div>
          <button
            onClick={handleDownloadReport}
            disabled={!input}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-none text-[10px] uppercase tracking-wider font-black transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            DOWNLOAD_REPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Columns: Input & Salts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col">
            <div className="bg-zinc-900/40 border border-b-0 border-zinc-800 rounded-none px-4 py-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                RAW_INPUT_SOURCE
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter message text or raw payload bytes to hash..."
              className="w-full h-44 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none rounded-none"
              spellCheck="false"
            />
          </div>

          {/* Salting Controls */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Signature salt (Optional)
            </h3>
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Enter salt key..."
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
              {salt && (
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-zinc-600">Position:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="salt_pos"
                      checked={saltPosition === 'prefix'}
                      onChange={() => setSaltPosition('prefix')}
                      className="text-white bg-zinc-950 border-zinc-800 focus:ring-0 w-3 h-3 accent-white"
                    />
                    <span className="text-zinc-400">Prepend</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="salt_pos"
                      checked={saltPosition === 'suffix'}
                      onChange={() => setSaltPosition('suffix')}
                      className="text-white bg-zinc-950 border-zinc-800 focus:ring-0 w-3 h-3 accent-white"
                    />
                    <span className="text-zinc-400">Append</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Hash Verifier */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-white" /> CHECKSUM_VERIFIER
            </h3>
            <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">
              Paste a known reference checksum below to verify if target matches.
            </p>
            <input
              type="text"
              placeholder="Paste checksum to compare..."
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              spellCheck="false"
            />
            {verifyHash.trim() && (
              <div className="pt-1.5">
                {verifiedAlgorithm ? (
                  <div className="p-2.5 bg-zinc-900 border border-emerald-500/20 rounded-none flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] uppercase font-black tracking-wider">
                      VERIFIED MATCH ({verifiedAlgorithm})
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-zinc-900 border border-rose-500/20 rounded-none flex items-center gap-2 text-rose-500">
                    <EqualNot className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] uppercase font-black tracking-wider">
                      CHECKSUM MISMATCH
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Hashes Grid Panel - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-none p-4 space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800/60">
              <Fingerprint className="w-3.5 h-3.5" /> COMPUTED_SIGNATURES
            </h3>

            {/* Hashes Row Loop */}
            {[
              { name: 'MD5', value: hashes.md5, length: 128 },
              { name: 'SHA-1', value: hashes.sha1, length: 160 },
              { name: 'SHA-256', value: hashes.sha256, length: 256 },
              { name: 'SHA-512', value: hashes.sha512, length: 512 }
            ].map((hashItem) => {
              const matched = verifiedAlgorithm === hashItem.name;
              return (
                <div
                  key={hashItem.name}
                  className={`p-3.5 rounded-none border transition-all ${
                    matched
                      ? 'bg-zinc-900 border-emerald-500/50'
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-200">{hashItem.name}</span>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">{hashItem.length}-bit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {matched && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold uppercase animate-pulse">
                          Matched
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(hashItem.value, hashItem.name)}
                        className="text-zinc-500 hover:text-white transition cursor-pointer"
                        title="Copy hash"
                      >
                        {copiedKey === hashItem.name ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-300 break-all select-all leading-relaxed tracking-wider bg-zinc-900/40 p-2.5 rounded-none border border-zinc-850">
                    {hashItem.value || <span className="text-zinc-700 uppercase font-bold text-[9px]">Calculating...</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
