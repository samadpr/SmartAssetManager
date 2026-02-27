import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepreciationScheduleDialogComponent } from './depreciation-schedule-dialog.component';

describe('DepreciationScheduleDialogComponent', () => {
  let component: DepreciationScheduleDialogComponent;
  let fixture: ComponentFixture<DepreciationScheduleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepreciationScheduleDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepreciationScheduleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
