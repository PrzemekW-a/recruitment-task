import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StoreService } from './services/store.service';
import { DownloadService } from './services/download.service';
import { take } from 'rxjs';
import { MarketData } from './models/market-data.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AppComponent implements OnInit {
  readonly #storeService = inject(StoreService);
  readonly #downloadService = inject(DownloadService);

  error: WritableSignal<string | false> = signal(false);
  isLoading: WritableSignal<boolean> = signal(true);
  hasTimestamps: Signal<boolean> = computed(() => this.#storeService.availableTimestamps().length > 0);

  ngOnInit(): void {
    this.#downloadService.downloadAndParseJsonLines$()
      .pipe(take(1))
      .subscribe({
        next: (data: MarketData[]) => {
          if (!data || data.length === 0) {
            this.error.set('No data.');
            this.isLoading.set(false);
            return;
          }
          const storeData = this.#storeService.data;
          const availableTimeStamps = this.#storeService.availableTimestamps;

          storeData.set(data);
          availableTimeStamps.set(data.map((snapshot: MarketData) => snapshot.Time));

          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Error occured.');
          this.isLoading.set(false);
        }
      });
  }
}
