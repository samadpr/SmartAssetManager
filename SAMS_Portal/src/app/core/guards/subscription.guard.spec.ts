import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { subscriptionGuard } from './subscription.guard';

describe('subscriptionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => subscriptionGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
