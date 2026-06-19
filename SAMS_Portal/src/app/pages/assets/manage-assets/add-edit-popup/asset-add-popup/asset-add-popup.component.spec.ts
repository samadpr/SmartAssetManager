import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetAddPopupComponent } from './asset-add-popup.component';

describe('AssetAddPopupComponent', () => {
  let component: AssetAddPopupComponent;
  let fixture: ComponentFixture<AssetAddPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetAddPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetAddPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
