import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BettingApiService } from '../../services/betting-api.service';
import { Match, BettingState, Bet } from '../../interfaces/betting.interfaces';
import { HttpClientModule } from '@angular/common/http';

interface BetListItem {
  userId: string;
  wrestler: string;
  amount: number;
}

@Component({
  selector: 'app-current-match',
  templateUrl: './current-match.component.html',
  styleUrls: ['./current-match.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [BettingApiService]
})
export class CurrentMatchComponent implements OnInit, OnDestroy {
  match: Match | null = null;
  bettingState: BettingState | null = null;
  currentBets: Record<string, Bet> = {};
  error: string = '';
  protected readonly Object = Object;

  constructor(private bettingApi: BettingApiService) {}

  ngOnInit(): void {
    this.loadMatchData();
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => this.loadMatchData(), 30000);
  }

  loadMatchData(): void {
    // Get current match
    this.bettingApi.getCurrentMatch().subscribe({
      next: (match) => {
        this.match = match;
        this.error = '';
      },
      error: (error) => {
        this.error = 'No active match found';
        console.error('Error loading match:', error);
      }
    });

    // Get betting state
    this.bettingApi.getBettingState().subscribe({
      next: (state) => {
        this.bettingState = state;
      },
      error: (error) => {
        console.error('Error loading betting state:', error);
      }
    });

    // Get current bets
    this.bettingApi.getCurrentBets().subscribe({
      next: (bets) => {
        this.currentBets = bets;
      },
      error: (error) => {
        console.error('Error loading current bets:', error);
      }
    });
  }

  getBetCount(wrestler: string): number {
    return Object.values(this.currentBets)
      .filter(bet => bet.wrestler === wrestler)
      .length;
  }

  getBetsList(): BetListItem[] {
    return Object.entries(this.currentBets).map(([userId, bet]) => ({
      userId,
      wrestler: bet.wrestler,
      amount: bet.amount
    }));
  }

  ngOnDestroy(): void {
    // Clear the interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private refreshInterval: any;
}
