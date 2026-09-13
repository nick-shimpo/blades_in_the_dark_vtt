import { useLedger } from '../../ui/context';

export function ReferencesView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>REFERENCES</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
