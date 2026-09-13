import { useLedger } from '../../ui/context';

export function SceneView() {
  const { ledger } = useLedger();
  return (
    <div class="placeholder">
      <h2>SCENE</h2>
      <p>{ledger.crew.name || 'Unnamed Crew'} · this view is being built</p>
    </div>
  );
}
