import { FirebaseStore, firebaseAvailable } from './firebase';
import { LocalStore, type Store } from './store';

export * from './store';
export { firebaseAvailable } from './firebase';

/** The one place that decides between the shared database and this browser only. */
export function createStore(campaignId: string): Store {
  return firebaseAvailable() ? new FirebaseStore(campaignId) : new LocalStore(campaignId);
}
