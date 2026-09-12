import { useLedger } from '../../ui/context';

export function TableView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>TABLE</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
