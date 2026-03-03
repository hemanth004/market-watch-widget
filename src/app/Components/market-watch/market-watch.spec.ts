import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MarketWatch } from './market-watch';
import { PriceStream } from '../../Services/price-stream';
import { Subject } from 'rxjs';
import { PriceTick } from '../../Models/price-tick.model';
import { vi } from 'vitest';

describe('MarketWatch Component', () => {
  let component: MarketWatch;
  let fixture: ComponentFixture<MarketWatch>;
  let priceSubject: Subject<PriceTick | null>;
  let mockPriceStream: any;

  beforeEach(async () => {
    priceSubject = new Subject<PriceTick | null>();

    mockPriceStream = {
      start: vi.fn(),
      stop: vi.fn(),
      price$: priceSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [MarketWatch],
      providers: [
        { provide: PriceStream, useValue: mockPriceStream }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketWatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ============================
  // Component creation
  // ============================

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  // ============================
  // Should start stream on init
  // ============================

  it('should start price stream on init', () => {
    expect(mockPriceStream.start).toHaveBeenCalled();
  });

  // ============================
  // Should update latest price
  // ============================

  it('should update latest price on new emission', () => {
    const tick: PriceTick = {
      value: 150,
      timestamp: Date.now()
    };

    priceSubject.next(tick);

    expect(component.latestPrice).toBe(150);
    expect(component.prices.length).toBe(1);
  });

  // ============================
  // Toggle stream
  // ============================

  it('should stop stream when running', () => {
    component.isRunning = true;

    component.toggleStream();

    expect(mockPriceStream.stop).toHaveBeenCalled();
    expect(component.isRunning).toBe(false);
  });

  it('should start stream when stopped', () => {
    component.isRunning = false;

    component.toggleStream();

    expect(mockPriceStream.start).toHaveBeenCalled();
    expect(component.isRunning).toBe(true);
  });

  // ============================
  // Rolling window trim
  // ============================

  it('should trim prices older than one minute', () => {
    const oldTick: PriceTick = {
      value: 100,
      timestamp: Date.now() - 61000
    };

    const newTick: PriceTick = {
      value: 120,
      timestamp: Date.now()
    };

    component.prices = [oldTick, newTick];

    (component as any).trimToOneMinute();

    expect(component.prices.length).toBe(1);
    expect(component.prices[0].value).toBe(120);
  });

  // ============================
  // Destroy lifecycle
  // ============================

  it('should destroy chart on ngOnDestroy', () => {
    component['chart'] = {
      destroy: vi.fn()
    } as any;

    component.ngOnDestroy();

    expect(component['chart'].destroy).toHaveBeenCalled();
  });
});