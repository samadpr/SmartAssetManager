import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetApproveComponent } from './asset-approve.component';

describe('AssetApproveComponent', () => {
  let component: AssetApproveComponent;
  let fixture: ComponentFixture<AssetApproveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetApproveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
