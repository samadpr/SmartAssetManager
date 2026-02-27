import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrBarcodePreviewDialogComponent } from './qr-barcode-preview-dialog.component';

describe('QrBarcodePreviewDialogComponent', () => {
  let component: QrBarcodePreviewDialogComponent;
  let fixture: ComponentFixture<QrBarcodePreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrBarcodePreviewDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrBarcodePreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
