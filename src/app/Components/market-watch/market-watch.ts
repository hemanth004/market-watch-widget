import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration } from 'chart.js/auto';

import { PriceStream } from '../../Services/price-stream';
import { PriceTick } from '../../Models/price-tick.model';

@Component({
  selector: 'app-market-watch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './market-watch.html',
  styleUrl: './market-watch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketWatch implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('priceChart') priceChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chart!: Chart<'line'>;

  latestPrice?: number;
  previousPrice?: number;
  lastUpdated?: string;

  prices: PriceTick[] = [];
  trend: 'up' | 'down' | null = null;

  threshold?: number;
  isAlert = false;
  isRunning = true;

  constructor(
    private priceStream: PriceStream,
    private cdr: ChangeDetectorRef
  ) {}

  
  // Lifecycle Hooks

  ngOnInit(): void {
    this.priceStream.start();

    this.priceStream.price$
      .pipe(takeUntil(this.destroy$))
      .subscribe((price: PriceTick | null) => {
        if (!price) return;

        // Store previous price
        this.previousPrice = this.latestPrice;

        // Update latest price
        this.latestPrice = price.value;
        this.lastUpdated = new Date(price.timestamp).toLocaleTimeString();

        // Determine trend direction
        if (this.previousPrice !== undefined) {
          this.trend =
            this.latestPrice > this.previousPrice ? 'up' : 'down';
        }

        // Threshold logic
        if (this.threshold !== undefined && this.threshold !== null) {
          this.isAlert = this.latestPrice > this.threshold;
        } else {
          this.isAlert = false;
        }

        // Maintain rolling 1-minute window
        this.prices.push(price);
        this.trimToOneMinute();

        // Update chart
        this.updateChart();

        // Trigger UI update (OnPush)
        this.cdr.markForCheck();
      });
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

  // Stream Control

  toggleStream(): void {
    if (this.isRunning) {
      this.priceStream.stop();
    } else {
      this.priceStream.start();
    }

    this.isRunning = !this.isRunning;
    this.cdr.markForCheck();
  }

  // Chart Setup

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
        datasets: [
          {
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
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        
        animation: {
          duration: 300
        },
        plugins: {
  legend: {
    display: false
  },
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
      title: (context) => {
        const index = context[0].dataIndex;
        const tick = this.prices[index];
        return new Date(tick.timestamp).toLocaleTimeString();
      },
      label: (context) => {
        return `Price: ₹ ${context.formattedValue}`;
      }
    }
  }
},
interaction: {
  mode: 'index',
  intersect: false
},
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 6,
              maxRotation: 0,
              minRotation: 0,
              color: '#64748b'
            },
            grid: {
              color: 'rgba(100,116,139,0.1)'
            }
          },
          y: {
            grace: '12%',
            ticks: {
              padding: 8,
              maxTicksLimit: 8,
              color: '#64748b'
            },
            grid: {
              color: 'rgba(100,116,139,0.1)'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // Chart Update Logic

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.prices.map(p =>
      new Date(p.timestamp).toLocaleTimeString([], {
        minute: '2-digit',
        second: '2-digit'
      })
    );

    this.chart.data.datasets[0].data =
      this.prices.map(p => p.value);

    // Smooth update without re-animation
    this.chart.update('none');
  }

  // Rolling Window Logic

  private trimToOneMinute(): void {
    const cutoff = Date.now() - 60000;

    while (
      this.prices.length &&
      this.prices[0].timestamp < cutoff
    ) {
      this.prices.shift();
    }
  }
}