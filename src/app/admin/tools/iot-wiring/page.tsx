'use client';

import IoTArchitectureDiagram from '../IoTArchitectureDiagram';

export default function IoTWiringPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Admin Tools</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">IoT Wiring Architecture</h2>
        <p className="mt-0.5 text-sm text-slate-400">Rujukan wiring diagram untuk FarmSense Smart Farm hardware setup.</p>
      </div>
      <IoTArchitectureDiagram />
    </div>
  );
}
