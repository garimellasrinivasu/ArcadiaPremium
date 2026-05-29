import { useState } from "react";

// Constants
const GUNTAS_PER_ACRE = 40;
const SQM_PER_GUNTA = 101.17;
const SQY_PER_SQM = 1.19599;
const SQM_PER_SQY = 0.83613;

function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toLocaleString("en-IN");
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ConverterCardProps {
  number: number;
  title: string;
  formula: string;
  children: React.ReactNode;
}

function ConverterCard({ number, title, formula, children }: ConverterCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b-2 border-blue-100">
        <span className="w-7 h-7 bg-blue-600 text-white rounded-md flex items-center justify-center text-xs font-bold">
          {number}
        </span>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      {children}
      <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-dashed border-gray-200">{formula}</p>
    </div>
  );
}

export default function LandConverterPage() {
  // 1. Ac.Guntas → Sq Meters
  const [ag2sm, setAg2sm] = useState({ acres: "", guntas: "" });
  const ag2smResult = (() => {
    const acres = parseFloat(ag2sm.acres) || 0;
    const guntas = parseFloat(ag2sm.guntas) || 0;
    if (acres === 0 && guntas === 0) return null;
    const totalGuntas = acres * GUNTAS_PER_ACRE + guntas;
    return totalGuntas * SQM_PER_GUNTA;
  })();

  // 2. Ac.Guntas → Sq Yards
  const [ag2sy, setAg2sy] = useState({ acres: "", guntas: "" });
  const ag2syResult = (() => {
    const acres = parseFloat(ag2sy.acres) || 0;
    const guntas = parseFloat(ag2sy.guntas) || 0;
    if (acres === 0 && guntas === 0) return null;
    const totalGuntas = acres * GUNTAS_PER_ACRE + guntas;
    return totalGuntas * SQM_PER_GUNTA * SQY_PER_SQM;
  })();

  // 3. Sq Meters → Ac.Guntas
  const [sm2ag, setSm2ag] = useState("");
  const sm2agResult = (() => {
    const sqm = parseFloat(sm2ag) || 0;
    if (sqm === 0) return null;
    const totalGuntas = sqm / SQM_PER_GUNTA;
    const acres = Math.floor(totalGuntas / GUNTAS_PER_ACRE);
    const guntas = totalGuntas - acres * GUNTAS_PER_ACRE;
    return { acres, guntas };
  })();

  // 4. Sq Yards → Ac.Guntas
  const [sy2ag, setSy2ag] = useState("");
  const sy2agResult = (() => {
    const sqy = parseFloat(sy2ag) || 0;
    if (sqy === 0) return null;
    const sqm = sqy * SQM_PER_SQY;
    const totalGuntas = sqm / SQM_PER_GUNTA;
    const acres = Math.floor(totalGuntas / GUNTAS_PER_ACRE);
    const guntas = totalGuntas - acres * GUNTAS_PER_ACRE;
    return { acres, guntas };
  })();

  // 5. Sq Meters → Sq Yards
  const [sm2sy, setSm2sy] = useState("");
  const sm2syResult = (() => {
    const sqm = parseFloat(sm2sy) || 0;
    if (sqm === 0) return null;
    return sqm * SQY_PER_SQM;
  })();

  // 6. Ac.Guntas → Ac.Cents
  const [ag2ac, setAg2ac] = useState({ acres: "", guntas: "" });
  const ag2acResult = (() => {
    const acres = parseFloat(ag2ac.acres) || 0;
    const guntas = parseFloat(ag2ac.guntas) || 0;
    if (acres === 0 && guntas === 0) return null;
    const totalCents = (acres * 100) + (guntas * 2.5);
    const resultAcres = Math.floor(totalCents / 100);
    const resultCents = totalCents - resultAcres * 100;
    return { acres: resultAcres, cents: resultCents };
  })();

  // 7. Ac.Cents → Ac.Guntas
  const [ac2ag, setAc2ag] = useState({ acres: "", cents: "" });
  const ac2agResult = (() => {
    const acres = parseFloat(ac2ag.acres) || 0;
    const cents = parseFloat(ac2ag.cents) || 0;
    if (acres === 0 && cents === 0) return null;
    const totalCents = (acres * 100) + cents;
    const totalGuntas = totalCents / 2.5;
    const resultAcres = Math.floor(totalGuntas / GUNTAS_PER_ACRE);
    const resultGuntas = totalGuntas - resultAcres * GUNTAS_PER_ACRE;
    return { acres: resultAcres, guntas: resultGuntas };
  })();

  const inputClass =
    "w-full px-3 py-2.5 border-2 border-blue-100 rounded-lg text-base text-gray-800 focus:border-blue-500 focus:outline-none transition";

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Land Unit Converter</h1>
        <p className="text-sm text-blue-600 mt-1">Acres-Guntas, Square Meters & Square Yards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {/* 1. Ac.Guntas → Sq Meters */}
        <ConverterCard number={1} title="Acres.Guntas → Square Meters" formula="1 Acre = 40 Guntas | 1 Gunta = 101.17 Sq.m">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Acres</label>
              <input type="number" className={inputClass} placeholder="0" min="0"
                value={ag2sm.acres} onChange={(e) => setAg2sm({ ...ag2sm, acres: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Guntas</label>
              <input type="number" className={inputClass} placeholder="0" min="0" max="39"
                value={ag2sm.guntas} onChange={(e) => setAg2sm({ ...ag2sm, guntas: e.target.value })} />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {ag2smResult !== null ? (
              <><span className="text-lg font-bold text-gray-800">{formatNumber(ag2smResult)}</span>
                <span className="text-sm text-blue-600 ml-2">Square Meters</span></>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter acres and guntas above</span>
            )}
          </div>
        </ConverterCard>

        {/* 2. Ac.Guntas → Sq Yards */}
        <ConverterCard number={2} title="Acres.Guntas → Square Yards" formula="1 Acre = 40 Guntas | 1 Gunta = 121.0 Sq.yd">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Acres</label>
              <input type="number" className={inputClass} placeholder="0" min="0"
                value={ag2sy.acres} onChange={(e) => setAg2sy({ ...ag2sy, acres: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Guntas</label>
              <input type="number" className={inputClass} placeholder="0" min="0" max="39"
                value={ag2sy.guntas} onChange={(e) => setAg2sy({ ...ag2sy, guntas: e.target.value })} />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {ag2syResult !== null ? (
              <><span className="text-lg font-bold text-gray-800">{formatNumber(ag2syResult)}</span>
                <span className="text-sm text-blue-600 ml-2">Square Yards</span></>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter acres and guntas above</span>
            )}
          </div>
        </ConverterCard>

        {/* 3. Sq Meters → Ac.Guntas */}
        <ConverterCard number={3} title="Square Meters → Acres.Guntas" formula="1 Acre = 4,046.86 Sq.m | 1 Gunta = 101.17 Sq.m">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Square Meters</label>
            <input type="number" className={inputClass} placeholder="0" min="0"
              value={sm2ag} onChange={(e) => setSm2ag(e.target.value)} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {sm2agResult !== null ? (
              <span className="text-lg font-bold text-gray-800">
                {sm2agResult.acres} Acres {formatNumber(sm2agResult.guntas)} Guntas
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter square meters above</span>
            )}
          </div>
        </ConverterCard>

        {/* 4. Sq Yards → Ac.Guntas */}
        <ConverterCard number={4} title="Square Yards → Acres.Guntas" formula="1 Sq.yd = 0.8361 Sq.m | 1 Acre = 4,840 Sq.yd">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Square Yards</label>
            <input type="number" className={inputClass} placeholder="0" min="0"
              value={sy2ag} onChange={(e) => setSy2ag(e.target.value)} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {sy2agResult !== null ? (
              <span className="text-lg font-bold text-gray-800">
                {sy2agResult.acres} Acres {formatNumber(sy2agResult.guntas)} Guntas
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter square yards above</span>
            )}
          </div>
        </ConverterCard>

        {/* 5. Sq Meters → Sq Yards */}
        <ConverterCard number={5} title="Square Meters → Square Yards" formula="1 Sq.m = 1.19599 Sq.yd">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Square Meters</label>
            <input type="number" className={inputClass} placeholder="0" min="0"
              value={sm2sy} onChange={(e) => setSm2sy(e.target.value)} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {sm2syResult !== null ? (
              <><span className="text-lg font-bold text-gray-800">{formatNumber(sm2syResult)}</span>
                <span className="text-sm text-blue-600 ml-2">Square Yards</span></>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter square meters above</span>
            )}
          </div>
        </ConverterCard>

        {/* 6. Ac.Guntas → Ac.Cents */}
        <ConverterCard number={6} title="Acres.Guntas → Acres.Cents" formula="1 Acre = 40 Guntas = 100 Cents | 1 Gunta = 2.5 Cents">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Acres</label>
              <input type="number" className={inputClass} placeholder="0" min="0"
                value={ag2ac.acres} onChange={(e) => setAg2ac({ ...ag2ac, acres: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Guntas</label>
              <input type="number" className={inputClass} placeholder="0" min="0" max="39"
                value={ag2ac.guntas} onChange={(e) => setAg2ac({ ...ag2ac, guntas: e.target.value })} />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {ag2acResult !== null ? (
              <span className="text-lg font-bold text-gray-800">
                {ag2acResult.acres} Acres {formatNumber(ag2acResult.cents)} Cents
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter acres and guntas above</span>
            )}
          </div>
        </ConverterCard>

        {/* 7. Ac.Cents → Ac.Guntas */}
        <ConverterCard number={7} title="Acres.Cents → Acres.Guntas" formula="1 Cent = 0.4 Guntas | 100 Cents = 40 Guntas = 1 Acre">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Acres</label>
              <input type="number" className={inputClass} placeholder="0" min="0"
                value={ac2ag.acres} onChange={(e) => setAc2ag({ ...ac2ag, acres: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Cents</label>
              <input type="number" className={inputClass} placeholder="0" min="0" max="99"
                value={ac2ag.cents} onChange={(e) => setAc2ag({ ...ac2ag, cents: e.target.value })} />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-h-[44px] flex items-center">
            {ac2agResult !== null ? (
              <span className="text-lg font-bold text-gray-800">
                {ac2agResult.acres} Acres {formatNumber(ac2agResult.guntas)} Guntas
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">Enter acres and cents above</span>
            )}
          </div>
        </ConverterCard>
      </div>
    </div>
  );
}
