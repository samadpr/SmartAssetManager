import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetQrBarcodeComponent } from './asset-qr-barcode.component';

describe('AssetQrBarcodeComponent', () => {
  let component: AssetQrBarcodeComponent;
  let fixture: ComponentFixture<AssetQrBarcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetQrBarcodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetQrBarcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
