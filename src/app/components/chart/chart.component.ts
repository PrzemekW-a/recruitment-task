import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  ViewChild
} from '@angular/core';
import { FormattedSnapshotData } from '../../models/formatted-snapshot-data.model';
import * as echarts from 'echarts';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements AfterViewInit {
  chartData = input.required<FormattedSnapshotData>()

  @ViewChild('main') chartDom!: ElementRef<HTMLDivElement>;

  readonly #utilsService = inject(UtilsService);

  private chartInstance: echarts.ECharts | null = null;

  constructor() {
    effect(() => {
      const data = this.chartData();

      if (data) {
        this.generateChart();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.generateChart()
    })
  }

  private generateChart(): void {
    const rawData = this.chartData();

    if (!this.chartDom || !rawData) return;

    const { bidSeriesData, askSeriesData } = this.#utilsService.processData(rawData);

    if (!this.chartInstance) {
      this.chartInstance = echarts.init(this.chartDom.nativeElement);
    }

    const options: echarts.EChartsOption = this.#utilsService.getChartOptions(bidSeriesData, askSeriesData);

    this.chartInstance.setOption(options);
  }
}
