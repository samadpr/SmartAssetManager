import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintDialogComponent } from './print-dialog.component';

describe('PrintDialogComponent', () => {
  let component: PrintDialogComponent;
  let fixture: ComponentFixture<PrintDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
