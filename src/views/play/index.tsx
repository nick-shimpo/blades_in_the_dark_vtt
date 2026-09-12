import { useLedger } from '../../ui/context';

export function PlayView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>PLAY</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
