import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignSubscriptionDialogComponent } from './assign-subscription-dialog.component';

describe('AssignSubscriptionDialogComponent', () => {
  let component: AssignSubscriptionDialogComponent;
  let fixture: ComponentFixture<AssignSubscriptionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignSubscriptionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignSubscriptionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
