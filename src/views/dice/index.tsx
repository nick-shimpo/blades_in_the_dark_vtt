import { DiceTray } from '../scene/DiceTray';
import './dice.css';

/**
 * Dice as a page of its own: the same tray that sits beside the Play surface on a desktop,
 * filling the view. This is the phone's window onto the table's rolls.
 */
export function DiceView() {
  return (
    <div class="dice-page">
      <DiceTray />
    </div>
  );
}
