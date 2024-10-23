import { Routes } from '@angular/router';
import { CurrentMatchComponent } from './components/current-match/current-match.component';

export const routes: Routes = [
  { path: '', component: CurrentMatchComponent },
  { path: '**', redirectTo: '' }
];
