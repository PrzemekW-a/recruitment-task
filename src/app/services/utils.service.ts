import { inject, Injectable } from '@angular/core';
import { OrderLevel } from '../models/order-level.model';
import { StoreService } from './store.service';
import { MarketData } from '../models/market-data.model';
import { FormattedSnapshotData } from '../models/formatted-snapshot-data.model';
import * as echarts from 'echarts';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  readonly #storeService = inject(StoreService)

  mapJsonToObjArray(response: string): MarketData[] {
    const lines = response.trim().split('\n');
    const parsedData: MarketData[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const parsedObject = JSON.parse(trimmedLine);
        parsedData.push(parsedObject);
      }
    });

    return parsedData;
  }

  selectTimestamp(timestamp: string): void {
    const storeData: MarketData[] = this.#storeService.data();

    if (!timestamp) {
      this.#storeService.selectedTimestamp.set(null);
      this.#storeService.currentSnapshotData.set(null);
      return;
    }

    this.#storeService.selectedTimestamp.set(timestamp);

    if (!storeData.length) return;

    const snapshot: MarketData = storeData.find((s: MarketData) => s.Time === timestamp)!;

    if (snapshot) {
      const bids: OrderLevel[] = [];
      const asks: OrderLevel[] = [];

      const maxLevel = Object.keys(snapshot)
        .filter(key => key.startsWith("Bid") || key.startsWith("Ask"))
        .reduce((max, key) => {
          const match = key.match(/(Bid|Ask)(\d+)/);
          if (match) {
            const level = parseInt(match[2], 10);
            if (level > max) {
              return level;
            }
          }
          return max;
        }, 0);

      for (let i = 1; i <= maxLevel; i++) {
        const bidPriceKey = `Bid${i}`;
        const bidSizeKey = `Bid${i}Size`;
        const askPriceKey = `Ask${i}`;
        const askSizeKey = `Ask${i}Size`;

        if (!!snapshot[bidPriceKey] && !!snapshot[bidSizeKey]) {
          bids.push({
            level: i,
            price: snapshot[bidPriceKey],
            size: snapshot[bidSizeKey]
          });
        }

        if (!!snapshot[askPriceKey] && !!snapshot[askSizeKey]) {
          asks.push({
            level: i,
            price: snapshot[askPriceKey],
            size: snapshot[askSizeKey]
          });
        }
      }

      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - b.price);

      this.#storeService.currentSnapshotData.set({
        timestamp: timestamp,
        bids: bids,
        asks: asks
      });
    } else {
      this.#storeService.currentSnapshotData.set(null);
    }
  }

  processData(data: FormattedSnapshotData): { bidSeriesData: [number, number][], askSeriesData: [number, number][] } {
    const asks = data.asks;
    const bids = [...data.bids].sort((a, b) => b.price - a.price);

    let cumulativeAskSize = 0;
    const askSeriesData: [number, number][] = asks.map(ask => {
      cumulativeAskSize += ask.size;
      return [cumulativeAskSize, ask.price];
    });

    let cumulativeBidSize = 0;
    const bidSeriesData: [number, number][] = bids.map(bid => {
      cumulativeBidSize += bid.size;
      return [-cumulativeBidSize, bid.price];
    });

    if (bids.length > 0) {
      bidSeriesData.unshift([0, bids[0].price]);
    }
    if (asks.length > 0) {
      askSeriesData.unshift([0, asks[0].price]);
    }


    return { bidSeriesData, askSeriesData };
  }

  getChartOptions(bidSeriesData: [number, number][], askSeriesData: [number, number][]): echarts.EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          let tooltipText = `Price: ${ params[0].axisValueLabel }<br/>`;
          params.forEach((item: any) => {
            const seriesName = item.seriesName;
            const size = Math.abs(item.value[0]);
            const price = item.value[1];
            if (size > 0) {
              tooltipText += `${ item.marker } ${ seriesName }: Size ${ size.toLocaleString() } @ ${ price }<br/>`;
            }
          });
          return tooltipText;
        }
      },
      legend: {
        data: ['Bids', 'Asks'],
        bottom: 10
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Cumulative Size',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: {
          formatter: (value: number) => {
            return Math.abs(value).toLocaleString();
          }
        },
      },
      yAxis: {
        type: 'value',
        name: 'Price',
        scale: true,
        axisLabel: {
          formatter: (value: number) => value.toFixed(4)
        }
      },
      series: [
        {
          name: 'Bids',
          type: 'line',
          step: 'end',
          symbol: 'none',
          data: bidSeriesData,
          itemStyle: {
            color: 'rgb(0, 128, 0)'
          },
          areaStyle: {
            color: 'rgba(0, 128, 0, 0.3)'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Asks',
          type: 'line',
          step: 'end',
          symbol: 'none',
          data: askSeriesData,
          itemStyle: {
            color: 'rgb(255, 0, 0)'
          },
          areaStyle: {
            color: 'rgba(255, 0, 0, 0.3)'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
  }
}
