import { Routes } from '@angular/router';
import { CurrentMatchComponent } from './components/current-match/current-match.component';
import { ConstantsComponent } from './components/constants/constants.component';

export const routes: Routes = [
  { path: '', component: CurrentMatchComponent },
  { path: 'constants', component: ConstantsComponent },
  { path: '**', redirectTo: '' }
];
