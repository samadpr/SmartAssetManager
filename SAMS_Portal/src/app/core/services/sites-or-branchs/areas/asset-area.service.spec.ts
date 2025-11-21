import { TestBed } from '@angular/core/testing';

import { AssetAreaService } from './asset-area.service';

describe('AssetAreaService', () => {
  let service: AssetAreaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetAreaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
