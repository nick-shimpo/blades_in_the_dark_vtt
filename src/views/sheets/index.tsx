import { useLedger } from '../../ui/context';

export function SheetsView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>SHEETS</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
