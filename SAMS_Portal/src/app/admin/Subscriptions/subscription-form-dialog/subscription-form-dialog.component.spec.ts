import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionFormDialogComponent } from './subscription-form-dialog.component';

describe('SubscriptionFormDialogComponent', () => {
  let component: SubscriptionFormDialogComponent;
  let fixture: ComponentFixture<SubscriptionFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
