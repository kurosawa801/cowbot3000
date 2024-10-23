export interface Match {
    wrestlers: string[];
}

export interface Bet {
    wrestler: string;
    amount: number;
}

export interface BetHistory {
    match: string;
    bet: Bet;
    result: string;
}

export interface UserCoins {
    coins: number;
}

export interface BettingState {
    isBettingOpen: boolean;
}

export interface RankingEntry {
    userId: string;
    balance: number;
}
