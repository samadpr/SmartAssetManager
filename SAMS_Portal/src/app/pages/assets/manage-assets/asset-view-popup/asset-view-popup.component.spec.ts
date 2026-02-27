import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetViewPopupComponent } from './asset-view-popup.component';

describe('AssetViewPopupComponent', () => {
  let component: AssetViewPopupComponent;
  let fixture: ComponentFixture<AssetViewPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetViewPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetViewPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
