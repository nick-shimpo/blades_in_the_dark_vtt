import { render } from 'preact';
import { App } from './app';
import './styles/app.css';
import './styles/compact.css';

render(<App />, document.getElementById('app')!);
