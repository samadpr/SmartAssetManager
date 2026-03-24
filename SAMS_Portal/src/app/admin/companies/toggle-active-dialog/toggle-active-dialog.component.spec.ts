import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleActiveDialogComponent } from './toggle-active-dialog.component';

describe('ToggleActiveDialogComponent', () => {
  let component: ToggleActiveDialogComponent;
  let fixture: ComponentFixture<ToggleActiveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleActiveDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleActiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
