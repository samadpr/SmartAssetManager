import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTransferReportComponent } from './asset-transfer-report.component';

describe('AssetTransferReportComponent', () => {
  let component: AssetTransferReportComponent;
  let fixture: ComponentFixture<AssetTransferReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetTransferReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetTransferReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
