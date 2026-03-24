import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteAssetOverviewComponent } from './site-asset-overview.component';

describe('SiteAssetOverviewComponent', () => {
  let component: SiteAssetOverviewComponent;
  let fixture: ComponentFixture<SiteAssetOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteAssetOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteAssetOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
