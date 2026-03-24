import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingActivationComponent } from './pending-activation.component';

describe('PendingActivationComponent', () => {
  let component: PendingActivationComponent;
  let fixture: ComponentFixture<PendingActivationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingActivationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingActivationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
