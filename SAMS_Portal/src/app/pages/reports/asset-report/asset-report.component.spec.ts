import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetReportComponent } from './asset-report.component';

describe('AssetReportComponent', () => {
  let component: AssetReportComponent;
  let fixture: ComponentFixture<AssetReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
