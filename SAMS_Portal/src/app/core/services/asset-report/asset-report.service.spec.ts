import { TestBed } from '@angular/core/testing';

import { AssetReportService } from './asset-report.service';

describe('AssetReportService', () => {
  let service: AssetReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
