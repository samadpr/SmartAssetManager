import { TestBed } from '@angular/core/testing';

import { AssetTransferReportService } from './asset-transfer-report.service';

describe('AssetTransferReportService', () => {
  let service: AssetTransferReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetTransferReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
