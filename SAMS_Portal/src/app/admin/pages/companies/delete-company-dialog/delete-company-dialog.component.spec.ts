import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCompanyDialogComponent } from './delete-company-dialog.component';

describe('DeleteCompanyDialogComponent', () => {
  let component: DeleteCompanyDialogComponent;
  let fixture: ComponentFixture<DeleteCompanyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCompanyDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteCompanyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
