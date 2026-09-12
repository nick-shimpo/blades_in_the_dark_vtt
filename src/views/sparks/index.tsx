import { useLedger } from '../../ui/context';

export function SparksView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>SPARKS</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
