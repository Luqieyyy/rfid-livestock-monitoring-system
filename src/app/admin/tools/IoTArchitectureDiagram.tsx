'use client';

import { useState } from 'react';

type CompKey = 'esp32' | 'dht22' | 'rc522' | 'hx711' | 'lcd' | 'servo' | 'ir' | 'buzzer';

const COMPONENTS: Record<CompKey, { title: string; pins: string[]; voltage: string; color: string }> = {
  esp32: {
    title: 'ESP32 Main Controller',
    voltage: '3.3V / 5V via USB',
    color: '#1a56db',
    pins: [
      'GPIO4  → DHT22 Data',
      'GPIO5  → RC522 RST',
      'GPIO13 → HX711 DOUT',
      'GPIO12 → HX711 SCK',
      'GPIO18 → RC522 SCK (SPI)',
      'GPIO19 → RC522 MISO (SPI)',
      'GPIO23 → RC522 MOSI (SPI)',
      'GPIO15 → RC522 SS/SDA',
      'GPIO21 → SDA (I2C LCD)',
      'GPIO22 → SCL (I2C LCD)',
      'GPIO32 → SG90 Servo PWM',
      'GPIO33 → IR Sensor OUT',
      'GPIO25 → Buzzer',
      '3.3V   → RC522, DHT22, HX711, IR, Buzzer',
      '5V/Vin → LCD VCC, Servo VCC',
      'GND    → All GND (common)',
    ],
  },
  dht22: {
    title: 'DHT22 Temperature & Humidity',
    voltage: '3.3V',
    color: '#0e9f6e',
    pins: ['VCC  → ESP32 3.3V', 'DATA → ESP32 GPIO4', 'GND  → ESP32 GND'],
  },
  rc522: {
    title: 'RC522 RFID Reader (13.56MHz)',
    voltage: '3.3V ONLY ⚠️',
    color: '#7e3af2',
    pins: [
      'VCC  → ESP32 3.3V  ⚠️ NOT 5V',
      'RST  → ESP32 GPIO5',
      'GND  → ESP32 GND',
      'MISO → ESP32 GPIO19',
      'MOSI → ESP32 GPIO23',
      'SCK  → ESP32 GPIO18',
      'SS   → ESP32 GPIO15',
    ],
  },
  hx711: {
    title: 'HX711 + Load Cell',
    voltage: '3.3V (use 3.3V pin)',
    color: '#ff5a1f',
    pins: [
      'VCC  → ESP32 3.3V',
      'DOUT → ESP32 GPIO13',
      'SCK  → ESP32 GPIO12',
      'GND  → ESP32 GND',
      'E+   → Load Cell Red wire',
      'E-   → Load Cell Black wire',
      'A+   → Load Cell White wire',
      'A-   → Load Cell Green wire',
    ],
  },
  lcd: {
    title: 'LCD 16x2 I2C',
    voltage: '5V + Level Shifter for I2C ⚠️',
    color: '#d97706',
    pins: [
      'VCC → ESP32 5V (Vin)',
      'GND → ESP32 GND',
      'SDA → Level Shifter HV → ESP32 GPIO21 (LV)',
      'SCL → Level Shifter HV → ESP32 GPIO22 (LV)',
    ],
  },
  servo: {
    title: 'SG90 Servo (Autogate)',
    voltage: '5V power, 3.3V signal OK',
    color: '#e02424',
    pins: [
      'Red (VCC)    → ESP32 5V (Vin)',
      'Brown (GND)  → ESP32 GND',
      'Orange (SIG) → ESP32 GPIO32',
    ],
  },
  ir: {
    title: 'IR Sensor (Entry Detector)',
    voltage: '3.3V',
    color: '#6b7280',
    pins: ['VCC → ESP32 3.3V', 'OUT → ESP32 GPIO33', 'GND → ESP32 GND'],
  },
  buzzer: {
    title: 'Active Buzzer',
    voltage: '3.3V',
    color: '#1f2937',
    pins: ['VCC → ESP32 3.3V', 'I/O → ESP32 GPIO25', 'GND → ESP32 GND'],
  },
};

export default function IoTArchitectureDiagram() {
  const [activeKey, setActiveKey] = useState<CompKey | null>(null);
  const [view, setView] = useState<'layout' | 'wiring'>('layout');

  const toggle = (key: CompKey) => setActiveKey(prev => (prev === key ? null : key));
  const active = activeKey ? COMPONENTS[activeKey] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">IoT Wiring Architecture</h2>
          </div>
          <p className="text-sm text-slate-500">
            FarmSense Smart Farm — Meja FYP <span className="font-semibold">100cm × 40cm</span> | 1× ESP32 | 1 Kandang
          </p>
        </div>
        <div className="flex gap-2">
          {(['layout', 'wiring'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${
                view === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {v === 'layout' ? '📐 Layout' : '🔌 Pin Map'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYOUT VIEW ─────────────────────────────────────────────────── */}
      {view === 'layout' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Klik mana-mana component dalam diagram untuk tengok pin wiring. Scale berdasarkan meja 100cm × 40cm.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-x-auto">
            <svg viewBox="0 0 1000 430" className="w-full min-w-[600px]" style={{ fontFamily: 'ui-monospace, monospace' }}>
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
                </marker>
                <marker id="arrPink" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#d946ef" />
                </marker>
                <marker id="arrGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Table boundary */}
              <rect x="8" y="8" width="984" height="414" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8,4" />
              <text x="20" y="28" fontSize="10" fill="#94a3b8" fontWeight="600">FYP TABLE — 100cm × 40cm</text>

              {/* ── WEIGHING LANE ────────────────────────────────────── */}
              <rect x="30" y="45" width="390" height="360" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
              <text x="44" y="65" fontSize="10" fill="#16a34a" fontWeight="700" letterSpacing="0.5">SMART WEIGHING LANE</text>

              {/* Cow entry */}
              <line x1="30" y1="225" x2="72" y2="225" stroke="#64748b" strokeWidth="2" markerEnd="url(#arr)" />
              <text x="8" y="220" fontSize="8" fill="#64748b">COW</text>
              <text x="8" y="231" fontSize="8" fill="#64748b">IN</text>

              {/* Lane walls */}
              <rect x="72" y="95" width="318" height="265" rx="4" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" />

              {/* IR Sensor */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('ir')}>
                <rect x="68" y="198" width="12" height="54" rx="3"
                  fill={activeKey === 'ir' ? '#4b5563' : '#9ca3af'} />
                <rect x="62" y="204" width="6" height="8" rx="1" fill="#6b7280" opacity="0.6" />
                <text x="85" y="218" fontSize="8" fill="#6b7280" fontWeight="600">IR</text>
                <text x="85" y="228" fontSize="7" fill="#6b7280">SENSOR</text>
              </g>

              {/* Entry gate (servo) */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('servo')}>
                <rect x="72" y="158" width="16" height="75" rx="3"
                  fill={activeKey === 'servo' ? '#ef4444' : '#fca5a5'} stroke="#f87171" strokeWidth="1.5" />
                <text x="93" y="188" fontSize="8" fill="#dc2626" fontWeight="600">ENTRY</text>
                <text x="93" y="198" fontSize="8" fill="#dc2626">GATE</text>
                <text x="93" y="208" fontSize="7" fill="#dc2626">(SG90)</text>
              </g>

              {/* RC522 */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('rc522')}>
                <rect x="155" y="100" width="115" height="44" rx="6"
                  fill={activeKey === 'rc522' ? '#7e3af2' : '#ede9fe'} stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="213" y="118" fontSize="10" fill={activeKey === 'rc522' ? 'white' : '#6d28d9'}
                  textAnchor="middle" fontWeight="700">RC522 RFID</text>
                <text x="213" y="131" fontSize="8" fill={activeKey === 'rc522' ? '#ddd6fe' : '#7c3aed'}
                  textAnchor="middle">13.56MHz Reader</text>
                <path d="M150 122 Q144 116 150 110" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
                <path d="M147 125 Q139 116 147 107" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.5" />
              </g>

              {/* Load cell platform */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('hx711')}>
                <circle cx="231" cy="250" r="70" fill={activeKey === 'hx711' ? '#fff7ed' : '#fef9c3'} stroke="#fbbf24" strokeWidth="2" />
                <circle cx="231" cy="250" r="52" fill="none" stroke="#fcd34d" strokeWidth="1" strokeDasharray="4,4" />
                <text x="231" y="241" fontSize="10" fill="#92400e" textAnchor="middle" fontWeight="700">LOAD CELL</text>
                <text x="231" y="254" fontSize="9" fill="#b45309" textAnchor="middle">PLATFORM</text>
                <text x="231" y="267" fontSize="8" fill="#d97706" textAnchor="middle">+ HX711</text>
              </g>

              {/* Exit gate */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('servo')}>
                <rect x="390" y="158" width="16" height="75" rx="3"
                  fill={activeKey === 'servo' ? '#ef4444' : '#fca5a5'} stroke="#f87171" strokeWidth="1.5" />
                <text x="350" y="188" fontSize="8" fill="#dc2626" fontWeight="600">EXIT</text>
                <text x="347" y="198" fontSize="8" fill="#dc2626">GATE</text>
                <text x="347" y="208" fontSize="7" fill="#dc2626">(SG90)</text>
              </g>

              {/* Cow exit */}
              <line x1="406" y1="225" x2="440" y2="225" stroke="#64748b" strokeWidth="2" markerEnd="url(#arr)" />
              <text x="442" y="220" fontSize="8" fill="#64748b">COW</text>
              <text x="442" y="231" fontSize="8" fill="#64748b">OUT</text>

              {/* ── MAIN MODULE / BARN ───────────────────────────────── */}
              <rect x="465" y="45" width="240" height="230" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
              <text x="479" y="65" fontSize="10" fill="#1d4ed8" fontWeight="700" letterSpacing="0.5">MAIN MODULE — BARN</text>

              {/* ESP32 */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('esp32')}>
                <rect x="492" y="78" width="140" height="78" rx="8"
                  fill={activeKey === 'esp32' ? '#1a56db' : '#dbeafe'} stroke="#3b82f6" strokeWidth="2" />
                <text x="562" y="104" fontSize="12" fill={activeKey === 'esp32' ? 'white' : '#1e40af'}
                  textAnchor="middle" fontWeight="800">ESP32</text>
                <text x="562" y="118" fontSize="8" fill={activeKey === 'esp32' ? '#bfdbfe' : '#3b82f6'}
                  textAnchor="middle">Main Controller</text>
                <text x="562" y="130" fontSize="8" fill={activeKey === 'esp32' ? '#bfdbfe' : '#3b82f6'}
                  textAnchor="middle">WiFi → Firebase</text>
                <text x="562" y="142" fontSize="7" fill={activeKey === 'esp32' ? '#93c5fd' : '#60a5fa'}
                  textAnchor="middle">3.3V Logic | USB Power</text>
              </g>

              {/* LCD */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('lcd')}>
                <rect x="492" y="168" width="140" height="56" rx="6"
                  fill={activeKey === 'lcd' ? '#92400e' : '#fef3c7'} stroke="#f59e0b" strokeWidth="1.5" />
                <text x="562" y="190" fontSize="10" fill={activeKey === 'lcd' ? 'white' : '#92400e'}
                  textAnchor="middle" fontWeight="700">LCD 16×2 I2C</text>
                <text x="562" y="203" fontSize="8" fill={activeKey === 'lcd' ? '#fde68a' : '#b45309'}
                  textAnchor="middle">Animal ID + Weight</text>
                <rect x="502" y="210" width="120" height="8" rx="2"
                  fill={activeKey === 'lcd' ? '#b45309' : '#fcd34d'} opacity="0.5" />
              </g>

              {/* DHT22 */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('dht22')}>
                <rect x="492" y="240" width="62" height="52" rx="6"
                  fill={activeKey === 'dht22' ? '#065f46' : '#d1fae5'} stroke="#10b981" strokeWidth="1.5" />
                <text x="523" y="262" fontSize="8" fill={activeKey === 'dht22' ? 'white' : '#065f46'}
                  textAnchor="middle" fontWeight="700">DHT22</text>
                <text x="523" y="274" fontSize="7" fill={activeKey === 'dht22' ? '#a7f3d0' : '#047857'}
                  textAnchor="middle">Temp/Hum</text>
              </g>

              {/* Buzzer */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('buzzer')}>
                <rect x="570" y="240" width="62" height="52" rx="6"
                  fill={activeKey === 'buzzer' ? '#111827' : '#f3f4f6'} stroke="#6b7280" strokeWidth="1.5" />
                <text x="601" y="262" fontSize="8" fill={activeKey === 'buzzer' ? 'white' : '#374151'}
                  textAnchor="middle" fontWeight="700">BUZZER</text>
                <text x="601" y="274" fontSize="7" fill={activeKey === 'buzzer' ? '#d1d5db' : '#6b7280'}
                  textAnchor="middle">Alert</text>
                <path d="M612 258 Q617 253 612 248" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
                <path d="M615 260 Q622 253 615 246" stroke="#9ca3af" strokeWidth="1.2" fill="none" opacity="0.5" />
              </g>

              {/* Firebase cloud */}
              <rect x="492" y="305" width="140" height="55" rx="10"
                fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x="562" y="325" fontSize="9" fill="#065f46" textAnchor="middle" fontWeight="700">☁ Firebase</text>
              <text x="562" y="338" fontSize="8" fill="#047857" textAnchor="middle">Firestore + FCM</text>
              <text x="562" y="350" fontSize="7" fill="#6ee7b7" textAnchor="middle">Admin Dashboard Sync</text>
              <line x1="562" y1="156" x2="562" y2="305" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" markerEnd="url(#arrGreen)" />
              <text x="570" y="238" fontSize="7" fill="#10b981">WiFi</text>

              {/* ── MINI AUTO FEEDER ─────────────────────────────────── */}
              <rect x="730" y="45" width="248" height="360" rx="10" fill="#fdf4ff" stroke="#e879f9" strokeWidth="2" />
              <text x="744" y="65" fontSize="10" fill="#a21caf" fontWeight="700" letterSpacing="0.5">MINI AUTO FEEDER</text>

              {/* Hopper box */}
              <rect x="764" y="85" width="180" height="180" rx="8" fill="#fae8ff" stroke="#d946ef" strokeWidth="1.5" />
              <line x1="764" y1="85" x2="944" y2="265" stroke="#e879f9" strokeWidth="1.5" opacity="0.35" />
              <line x1="944" y1="85" x2="764" y2="265" stroke="#e879f9" strokeWidth="1.5" opacity="0.35" />
              <text x="854" y="170" fontSize="11" fill="#a21caf" textAnchor="middle" fontWeight="600">Feed Hopper</text>
              <text x="854" y="185" fontSize="9" fill="#c026d3" textAnchor="middle">(Container)</text>

              {/* Feeder servo gate */}
              <g style={{ cursor: 'pointer' }} onClick={() => toggle('servo')}>
                <rect x="824" y="278" width="60" height="32" rx="5"
                  fill={activeKey === 'servo' ? '#ef4444' : '#fca5a5'} stroke="#f87171" strokeWidth="1.5" />
                <text x="854" y="293" fontSize="8" fill={activeKey === 'servo' ? 'white' : '#dc2626'}
                  textAnchor="middle" fontWeight="600">SG90</text>
                <text x="854" y="303" fontSize="7" fill={activeKey === 'servo' ? '#fecaca' : '#dc2626'}
                  textAnchor="middle">Feed Gate</text>
              </g>

              {/* Feed output */}
              <line x1="854" y1="310" x2="854" y2="390" stroke="#d946ef" strokeWidth="2"
                strokeDasharray="4,3" markerEnd="url(#arrPink)" />
              <text x="862" y="358" fontSize="8" fill="#a21caf">Feed</text>
              <text x="862" y="370" fontSize="8" fill="#a21caf">Output</text>

              {/* ── WIRING CONNECTIONS ───────────────────────────────── */}
              {/* ESP32 → RC522 */}
              <line x1="562" y1="78" x2="270" y2="144" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.65" />
              {/* ESP32 → HX711 */}
              <line x1="492" y1="120" x2="300" y2="200" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.65" />
              {/* ESP32 → Entry Servo */}
              <line x1="492" y1="108" x2="88" y2="195" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="5,3" opacity="0.55" />
              {/* ESP32 → IR Sensor */}
              <line x1="492" y1="130" x2="80" y2="218" stroke="#6b7280" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.45" />
              {/* ESP32 → Feeder Servo */}
              <line x1="632" y1="117" x2="824" y2="285" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="5,3" opacity="0.55" />
            </svg>
          </div>

          {/* Component detail panel */}
          {active && activeKey && (
            <div
              className="rounded-2xl border p-5 space-y-3 transition-all"
              style={{ borderColor: active.color + '50', background: active.color + '0a' }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">{active.title}</h3>
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: active.color + '20', color: active.color }}
                  >
                    {active.voltage}
                  </span>
                </div>
                <button onClick={() => setActiveKey(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {active.pins.map((pin, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-3 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active.color }} />
                    <span className="text-xs font-mono text-slate-700">{pin}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!activeKey && (
            <p className="text-center text-xs text-slate-400 py-1">
              👆 Klik mana-mana component dalam diagram untuk tengok pin wiring
            </p>
          )}
        </div>
      )}

      {/* ── PIN MAP VIEW ──────────────────────────────────────────────────── */}
      {view === 'wiring' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Complete pin mapping. Guna ni sebagai reference masa wiring ESP32.</p>
          {(Object.entries(COMPONENTS) as [CompKey, typeof COMPONENTS[CompKey]][]).map(([key, comp]) => (
            <div key={key} className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: comp.color + '12' }}>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: comp.color }} />
                <span className="font-semibold text-sm text-slate-800">{comp.title}</span>
                <span
                  className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: comp.color + '20', color: comp.color }}
                >
                  {comp.voltage}
                </span>
              </div>
              <div className="px-4 py-3 grid sm:grid-cols-2 gap-1.5 bg-white">
                {comp.pins.map((pin, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-600">
                    <span className="text-slate-300 shrink-0">→</span>
                    <span>{pin}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
