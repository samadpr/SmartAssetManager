import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionDeleteDialogComponent } from './subscription-delete-dialog.component';

describe('SubscriptionDeleteDialogComponent', () => {
  let component: SubscriptionDeleteDialogComponent;
  let fixture: ComponentFixture<SubscriptionDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionDeleteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
