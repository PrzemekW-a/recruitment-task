import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  Signal,
  WritableSignal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormattedSnapshotData } from '../../models/formatted-snapshot-data.model';
import { StoreService } from '../../services/store.service';
import { UtilsService } from '../../services/utils.service';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [FormsModule, CommonModule, ChartComponent],
  templateUrl: './trading.component.html',
  styleUrl: './trading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradingComponent implements OnInit {
  readonly #storeService = inject(StoreService);
  readonly #utilsService = inject(UtilsService);

  readonly availableTimestamps: Signal<string[]> = computed(() => this.#storeService.availableTimestamps());
  readonly selectedTimestamp: Signal<string> = computed(() => this.#storeService.selectedTimestamp());
  readonly currentSnapshotData: Signal<FormattedSnapshotData | null> = computed(() => this.#storeService.currentSnapshotData());
  readonly isPlaying: WritableSignal<boolean> = signal(false);

  intervalId: null | ReturnType<typeof setTimeout> = null;

  ngOnInit(): void {
    if (this.availableTimestamps()[0]) {
      this.#utilsService.selectTimestamp(this.availableTimestamps()[0]);
    }
  }

  onTimestampChange(event: Event): void {
    const selectedTime = (event.target as HTMLSelectElement).value;
    this.#utilsService.selectTimestamp(selectedTime);
  }

  playAllSnapshots(): void {
    const slidesDuration = 30000;
    const slideDuration = slidesDuration / this.availableTimestamps().length;

    this.isPlaying.update(v => !v);

    if (!this.isPlaying()) {
      this.clearInterval();
      return
    }

    this.#utilsService.selectTimestamp(this.availableTimestamps()[0]);

    this.intervalId = setInterval(() => {
      const currentTimestampIndex = this.availableTimestamps().indexOf(this.selectedTimestamp());
      const nextTimestampIndex = (currentTimestampIndex + 1);

      if (!!this.availableTimestamps()[nextTimestampIndex]) {
        this.#utilsService.selectTimestamp(this.availableTimestamps()[nextTimestampIndex]);
      } else {
        this.isPlaying.update(v => !v);
        this.clearInterval();
      }
    }, slideDuration);
  }

  private clearInterval(): void {
    this.intervalId && clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
