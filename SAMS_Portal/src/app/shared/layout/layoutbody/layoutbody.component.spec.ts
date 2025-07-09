import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutbodyComponent } from './layoutbody.component';

describe('LayoutbodyComponent', () => {
  let component: LayoutbodyComponent;
  let fixture: ComponentFixture<LayoutbodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutbodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutbodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
