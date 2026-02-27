import { TestBed } from '@angular/core/testing';

import { AssetQrBarcodeService } from './asset-qr-barcode.service';

describe('AssetQrBarcodeService', () => {
  let service: AssetQrBarcodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetQrBarcodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
