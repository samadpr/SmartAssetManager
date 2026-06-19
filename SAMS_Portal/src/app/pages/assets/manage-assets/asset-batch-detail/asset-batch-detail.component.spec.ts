import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetBatchDetailComponent } from './asset-batch-detail.component';

describe('AssetBatchDetailComponent', () => {
  let component: AssetBatchDetailComponent;
  let fixture: ComponentFixture<AssetBatchDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetBatchDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetBatchDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
