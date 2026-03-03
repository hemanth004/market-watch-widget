import { TestBed } from '@angular/core/testing';

import { PriceStream } from './price-stream';

describe('PriceStream', () => {
  let service: PriceStream;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceStream);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
