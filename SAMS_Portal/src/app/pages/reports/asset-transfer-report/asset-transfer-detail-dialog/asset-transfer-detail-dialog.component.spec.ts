import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTransferDetailDialogComponent } from './asset-transfer-detail-dialog.component';

describe('AssetTransferDetailDialogComponent', () => {
  let component: AssetTransferDetailDialogComponent;
  let fixture: ComponentFixture<AssetTransferDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetTransferDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetTransferDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
