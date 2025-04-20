import { OrderLevel } from './order-level.model';

export type FormattedSnapshotData = {
  timestamp: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
}
