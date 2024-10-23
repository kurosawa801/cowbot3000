import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { CurrentMatchComponent } from './components/current-match/current-match.component';
import { BettingApiService } from './services/betting-api.service';

@NgModule({
  declarations: [
    AppComponent,
    CurrentMatchComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: CurrentMatchComponent },
      { path: '**', redirectTo: '' }
    ])
  ],
  providers: [BettingApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
