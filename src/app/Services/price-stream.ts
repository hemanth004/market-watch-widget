import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { PriceTick } from '../Models/price-tick.model';

@Injectable()
export class PriceStream {

  private priceSubject = new BehaviorSubject<PriceTick | null>(null);
  price$ = this.priceSubject.asObservable();

  private subscription?: Subscription;
  private isActive = false;
  
  start(): void {
    if (this.isActive) return;

    this.isActive = true;

    this.subscription = interval(2000).pipe(
          map(() => ({
      value: +(Math.random() * 100 + 100).toFixed(2),
      timestamp: Date.now()
    }))
    )
    .subscribe((price) => {
    this.priceSubject.next(price);
    });
    
  }

  stop(): void {
  this.subscription?.unsubscribe();
  this.isActive = false;
}
}
