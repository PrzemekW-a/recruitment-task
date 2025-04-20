import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { MarketData } from '../models/market-data.model';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  readonly #http = inject(HttpClient);
  readonly #utils = inject(UtilsService);
  readonly #dataUrl = '/api/assets/files/sample.json';

  downloadAndParseJsonLines$(): Observable<MarketData[]> {
    return this.#http.get(this.#dataUrl, { responseType: 'text' }).pipe(
      map(this.#utils.mapJsonToObjArray),
    );
  }
}
