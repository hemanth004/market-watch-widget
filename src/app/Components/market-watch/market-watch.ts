import { 
  Component, 
  OnInit, 
  OnDestroy, 
  AfterViewInit, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef, 
  ViewChild, 
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration } from 'chart.js/auto';

import { PriceStream } from '../../Services/price-stream';
import { PriceTick } from '../../Models/price-tick.model';
import { callback } from 'chart.js/helpers';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-market-watch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './market-watch.html',
  styleUrl: './market-watch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PriceStream]
})
export class MarketWatch implements OnInit, OnDestroy, AfterViewInit {
  // --- View Children ---
  @ViewChild('priceChart') private priceChartRef!: ElementRef<HTMLCanvasElement>;

  // --- Private Properties ---
  private destroy$ = new Subject<void>();
  private chart!: Chart<'line'>;

  // --- Public State Properties ---
  prices: PriceTick[] = [];
  latestPrice?: number;
  previousPrice?: number;
  lastUpdated?: string;
  trend: 'up' | 'down' | null = null;
  
  // --- Control Properties ---
  threshold?: number;
  isAlert = false;
  isRunning = true;

  // --- Private Dependencies ---
  private priceStream = inject(PriceStream);
  private cdr = inject(ChangeDetectorRef);

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    this.priceStream.start();
    this.initPriceSubscription();
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // --- Subscription Logic ---

  private initPriceSubscription(): void {
    this.priceStream.price$
      .pipe(takeUntil(this.destroy$))
      .subscribe((price: PriceTick | null) => {
        if (!price) return;
        this.processNewPrice(price);
      });
  }

  private processNewPrice(price: PriceTick): void {
    // 1. Update Price History & State
    this.previousPrice = this.latestPrice;
    this.latestPrice = price.value;
    this.lastUpdated = new Date(price.timestamp).toLocaleTimeString();

    // 2. Business Logic (Trend & Alerts)
    this.calculateTrend();
    this.checkThreshold();

    // 3. Data Management
    this.prices.push(price);
    this.trimToOneMinute();

    // 4. UI & Chart Updates
    this.updateChart();
    this.cdr.markForCheck();
  }

  // --- Business Logic Helpers ---

  private calculateTrend(): void {
    if (this.previousPrice !== undefined && this.latestPrice !== undefined) {
      this.trend = this.latestPrice > this.previousPrice ? 'up' : 'down';
    }
  }

  private checkThreshold(): void {
    if (this.threshold != null && this.latestPrice != null) {
      this.isAlert = this.latestPrice > this.threshold;
    } else {
      this.isAlert = false;
    }
  }

  private trimToOneMinute(): void {
    const cutoff = Date.now() - 60000;
    while (this.prices.length && this.prices[0].timestamp < cutoff) {
      this.prices.shift();
    }
  }

  // --- Actions ---

  toggleStream(): void {
    this.isRunning ? this.priceStream.stop() : this.priceStream.start();
    this.isRunning = !this.isRunning;
    this.cdr.markForCheck();
  }

  // --- Chart Setup & Rendering ---

  private initializeChart(): void {
    const ctx = this.priceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(22,163,74,0.25)');
    gradient.addColorStop(1, 'rgba(22,163,74,0.02)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Price',
          data: [],
          borderColor: '#16a34a',
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#16a34a',
          pointHoverBorderWidth: 2
        }]
      },
      options: this.getChartOptions()
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.prices.map(p =>
      new Date(p.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );

    this.chart.data.datasets[0].data = this.prices.map(p => p.value);
    this.chart.update('none'); // Update without re-animation for performance
  }

  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#0f172a',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (context: any) => {
              const tick = this.prices[context[0].dataIndex];
              return new Date(tick.timestamp).toLocaleTimeString();
            },
            label: (context: any) => `Price: ₹ ${context.formattedValue}`
          }
        }
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Time', color: '#64748b', font: { size: 14 } },
          ticks: { autoSkip: true, maxTicksLimit: 6, maxRotation: 0, color: '#64748b' },
          grid: { color: 'rgba(100,116,139,0.1)' },
          
        },
        y: {
          grace: '12%',
          title: { display: true, text: 'Rupees', color: '#64748b', font: { size: 14 } },
          ticks: { padding: 8, maxTicksLimit: 8, color: '#64748b' },
          grid: { color: 'rgba(100,116,139,0.1)' },
          callback: (value: number) => {
            if (value >= 10000000) return '₹ {{value / 10000000}} Cr';
            if (value >= 100000) return '₹ {{value / 100000}} L';
            if (value >= 1000) return '₹ {{value / 1000}} K';
            return `₹ ${value}`;
          }
          
        }
      }
    };
  }
}