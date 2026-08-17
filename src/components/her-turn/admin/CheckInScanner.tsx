import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Keyboard } from 'lucide-react';

interface ScanResult {
  type: 'success' | 'already' | 'invalid';
  fullName?: string;
  ticketTier?: string;
  token: string;
}

const RESCAN_COOLDOWN_MS = 2500;

export default function CheckInScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ token: string; at: number } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [checking, setChecking] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      tick();
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Could not access the camera. Check browser permissions, or use manual entry below.');
    }
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code && code.data) {
      const now = Date.now();
      const last = lastScannedRef.current;
      if (!last || last.token !== code.data || now - last.at > RESCAN_COOLDOWN_MS) {
        lastScannedRef.current = { token: code.data, at: now };
        handleToken(code.data);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleToken(token: string) {
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('checkin_ticket', { p_qr_token: token, p_checked_in_by: 'admin-scanner' });
      if (error) throw error;
      const result = data?.[0];

      let scan: ScanResult;
      if (!result || (!result.valid && !result.already_checked_in)) {
        scan = { type: 'invalid', token };
      } else if (result.already_checked_in) {
        scan = { type: 'already', fullName: result.full_name, ticketTier: result.ticket_tier, token };
      } else {
        scan = { type: 'success', fullName: result.full_name, ticketTier: result.ticket_tier, token };
      }

      setLastResult(scan);
      setRecentScans(prev => [scan, ...prev].slice(0, 15));

      if (scan.type === 'success' && navigator.vibrate) navigator.vibrate(80);
      if (scan.type === 'invalid' && navigator.vibrate) navigator.vibrate([80, 60, 80]);
    } catch (err) {
      console.error('Check-in error:', err);
      setLastResult({ type: 'invalid', token });
    } finally {
      setChecking(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;
    handleToken(token);
    setManualToken('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner panel */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-sand-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-cocoa-700">Camera Scanner</h3>
            <div className="flex gap-2">
              {!cameraActive ? (
                <button onClick={startCamera} className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                  <Camera size={14} /> Start
                </button>
              ) : (
                <button onClick={stopCamera} className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                  <CameraOff size={14} /> Stop
                </button>
              )}
              <button onClick={() => setManualMode(prev => !prev)} className="inline-flex items-center gap-1.5 bg-sand-100 hover:bg-sand-200 text-cocoa-700 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                <Keyboard size={14} /> Manual
              </button>
            </div>
          </div>

          <div className="relative bg-cocoa-900 aspect-square flex items-center justify-center">
            <video ref={videoRef} className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`} playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="text-center text-sand-300 text-sm p-6">
                {cameraError || 'Tap "Start" to activate the camera and scan attendee QR codes at the door.'}
              </div>
            )}
            {cameraActive && (
              <div className="absolute inset-8 border-2 border-teal-400/70 rounded-2xl pointer-events-none" />
            )}
          </div>

          {manualMode && (
            <form onSubmit={handleManualSubmit} className="p-4 border-t border-sand-200 flex gap-2">
              <input
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Paste or type QR token"
                className="flex-1 bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
              />
              <button type="submit" disabled={checking} className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                Check In
              </button>
            </form>
          )}
        </div>

        {/* Last result + recent scans */}
        <div className="space-y-4">
          {lastResult && (
            <div className={`rounded-2xl border p-6 text-center space-y-2 ${
              lastResult.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
              lastResult.type === 'already' ? 'bg-amber-50 border-amber-200' :
              'bg-rose-50 border-rose-200'
            }`}>
              {lastResult.type === 'success' && <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />}
              {lastResult.type === 'already' && <AlertTriangle size={40} className="text-amber-500 mx-auto" />}
              {lastResult.type === 'invalid' && <XCircle size={40} className="text-rose-500 mx-auto" />}

              <h3 className="text-lg font-serif font-bold text-cocoa-700">
                {lastResult.type === 'success' && 'Checked In'}
                {lastResult.type === 'already' && 'Already Checked In'}
                {lastResult.type === 'invalid' && 'Invalid or Unpaid Ticket'}
              </h3>
              {lastResult.fullName && (
                <p className="text-sm text-slate-600">{lastResult.fullName} — {lastResult.ticketTier}</p>
              )}
              {lastResult.type === 'invalid' && (
                <p className="text-xs text-slate-500">This QR code doesn't match a paid registration.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-sand-200 shadow-sm">
            <div className="p-4 border-b border-sand-200">
              <h3 className="text-xs font-bold text-cocoa-700 uppercase">Recent Scans</h3>
            </div>
            <div className="divide-y divide-sand-100 max-h-80 overflow-y-auto">
              {recentScans.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 text-center">No scans yet.</p>
              ) : (
                recentScans.map((s, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-sm">
                    <span className="text-cocoa-700">{s.fullName || 'Unknown ticket'}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                      s.type === 'already' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {s.type === 'success' ? 'OK' : s.type === 'already' ? 'Dup' : 'Invalid'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
