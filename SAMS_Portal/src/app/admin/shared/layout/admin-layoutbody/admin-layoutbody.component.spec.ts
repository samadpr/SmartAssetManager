import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLayoutbodyComponent } from './admin-layoutbody.component';

describe('AdminLayoutbodyComponent', () => {
  let component: AdminLayoutbodyComponent;
  let fixture: ComponentFixture<AdminLayoutbodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutbodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLayoutbodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
