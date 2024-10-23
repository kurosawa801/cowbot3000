import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match, Bet, BetHistory, UserCoins, BettingState, RankingEntry } from '../interfaces/betting.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BettingApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Get current match
  getCurrentMatch(): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/match`);
  }

  // Get betting state
  getBettingState(): Observable<BettingState> {
    return this.http.get<BettingState>(`${this.apiUrl}/betting-state`);
  }

  // Get user coins
  getUserCoins(userId: string): Observable<UserCoins> {
    return this.http.get<UserCoins>(`${this.apiUrl}/coins/${userId}`);
  }

  // Get user bet history
  getUserHistory(userId: string): Observable<BetHistory[]> {
    return this.http.get<BetHistory[]>(`${this.apiUrl}/history/${userId}`);
  }

  // Get current bets
  getCurrentBets(): Observable<Record<string, Bet>> {
    return this.http.get<Record<string, Bet>>(`${this.apiUrl}/bets`);
  }

  // Get ranking
  getRanking(): Observable<RankingEntry[]> {
    return this.http.get<RankingEntry[]>(`${this.apiUrl}/ranking`);
  }
}
