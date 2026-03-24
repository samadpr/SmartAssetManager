import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetBulkUploadComponent } from './asset-bulk-upload.component';

describe('AssetBulkUploadComponent', () => {
  let component: AssetBulkUploadComponent;
  let fixture: ComponentFixture<AssetBulkUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetBulkUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetBulkUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
