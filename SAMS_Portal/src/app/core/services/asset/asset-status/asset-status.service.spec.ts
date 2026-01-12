import { TestBed } from '@angular/core/testing';

import { AssetStatusService } from './asset-status.service';

describe('AssetStatusService', () => {
  let service: AssetStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
