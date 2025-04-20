import { Injectable, signal, WritableSignal } from '@angular/core';
import { MarketData } from '../models/market-data.model';
import { FormattedSnapshotData } from '../models/formatted-snapshot-data.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  readonly data: WritableSignal<MarketData[]> = signal([]);
  readonly availableTimestamps: WritableSignal<string[]> = signal([]);
  readonly selectedTimestamp: WritableSignal<any> = signal(null);
  readonly currentSnapshotData: WritableSignal<FormattedSnapshotData | null> = signal(null);
}
