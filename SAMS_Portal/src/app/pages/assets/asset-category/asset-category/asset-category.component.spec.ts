import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetCategoryComponent } from './asset-category.component';

describe('AssetCategoryComponent', () => {
  let component: AssetCategoryComponent;
  let fixture: ComponentFixture<AssetCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
