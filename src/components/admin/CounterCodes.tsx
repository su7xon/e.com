import React, { useMemo, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import type { MenuItem } from '../../types';
import { POS_ADDONS, findCodeClash, fullCodes, isValidCode, normalizeCode } from '../../data/posCatalog';

interface CounterCodesProps {
  menuItems: MenuItem[];
  codes: Record<string, string>;
  onSave: (id: string, code: string) => Promise<void>;
}

interface Row {
  id: string;
  name: string;
  group: string;
}

const CodeRow: React.FC<{ row: Row; menuItems: MenuItem[]; codes: Record<string, string>; onSave: CounterCodesProps['onSave'] }> = ({
  row,
  menuItems,
  codes,
  onSave,
}) => {
  const saved = codes[row.id] || '';
  const [value, setValue] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  React.useEffect(() => setValue(saved), [saved]);

  const code = normalizeCode(value);
  const save = async () => {
    setDone(false);
    setError('');
    if (code === saved) return;
    if (code && !isValidCode(code)) return setError('Letters and numbers only, up to 8');
    const clash = code ? findCodeClash(row.id, code, codes, menuItems) : null;
    if (clash) return setError(clash);
    setBusy(true);
    try {
      await onSave(row.id, code);
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch {
      setError('Could not save. Check the internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t border-slate-100" data-code-row={row.id}>
      <td className="py-1.5 pr-2">
        <div className="text-xs font-bold text-slate-900">{row.name}</div>
        <div className="text-[11px] text-slate-500">{row.group}</div>
      </td>
      <td className="py-1.5 pr-2 w-28">
        <input
          aria-label={`Code for ${row.name}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError('');
          }}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          placeholder="—"
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </td>
      <td className="py-1.5 text-[11px] font-mono text-slate-500">
        {error ? (
          <span role="alert" className="font-sans font-bold text-red-600">{error}</span>
        ) : busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : done ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          fullCodes(row.id, code, menuItems).join(' / ')
        )}
      </td>
    </tr>
  );
};

/** Item and add-on codes for the counter. One list for all stores. */
export const CounterCodes: React.FC<CounterCodesProps> = ({ menuItems, codes, onSave }) => {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');

  const rows = useMemo<Row[]>(
    () => [
      ...menuItems.map((m) => ({ id: m.id, name: m.name, group: m.subCategoryTitle || m.category })),
      ...POS_ADDONS.map((a) => ({
        id: a.id,
        name: a.name,
        group: a.kind === 'crust' ? 'Add-ons: Crust' : a.kind === 'cheese' ? 'Add-ons: Cheese' : 'Add-ons: Toppings',
      })),
    ],
    [menuItems],
  );
  const groups = useMemo(() => Array.from(new Set(rows.map((r) => r.group))), [rows]);
  const q = search.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (group === 'all' || r.group === group) &&
      (!q || r.name.toLowerCase().includes(q) || (codes[r.id] || '').toLowerCase().includes(q)),
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-sm font-bold">ITEM CODES</div>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">
        Type the code on the bill screen, plus R / M / L for pizzas, NV for non-veg, P for premium. Changes apply at every store.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="codes-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item or code…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold">
          <option value="all">All categories</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-bold text-slate-500 uppercase">
              <th className="pb-1 pr-2">Item</th>
              <th className="pb-1 pr-2">Code</th>
              <th className="pb-1">Staff type</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <CodeRow key={r.id} row={r} menuItems={menuItems} codes={codes} onSave={onSave} />
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No items found.</p>}
    </div>
  );
};
