import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetEditPopupComponent } from './asset-edit-popup.component';

describe('AssetEditPopupComponent', () => {
  let component: AssetEditPopupComponent;
  let fixture: ComponentFixture<AssetEditPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetEditPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetEditPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
