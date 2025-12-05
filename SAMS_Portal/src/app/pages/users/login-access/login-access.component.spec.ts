import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAccessComponent } from './login-access.component';

describe('LoginAccessComponent', () => {
  let component: LoginAccessComponent;
  let fixture: ComponentFixture<LoginAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginAccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
