import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetBulkTransferComponent } from './asset-bulk-transfer.component';

describe('AssetBulkTransferComponent', () => {
  let component: AssetBulkTransferComponent;
  let fixture: ComponentFixture<AssetBulkTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetBulkTransferComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetBulkTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
