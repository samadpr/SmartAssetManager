import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleAddEditDialogComponent } from './role-add-edit-dialog.component';

describe('RoleAddEditDialogComponent', () => {
  let component: RoleAddEditDialogComponent;
  let fixture: ComponentFixture<RoleAddEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleAddEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleAddEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
