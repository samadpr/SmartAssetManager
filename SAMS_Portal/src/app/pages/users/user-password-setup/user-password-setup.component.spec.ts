import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPasswordSetupComponent } from './user-password-setup.component';

describe('UserPasswordSetupComponent', () => {
  let component: UserPasswordSetupComponent;
  let fixture: ComponentFixture<UserPasswordSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPasswordSetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPasswordSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
