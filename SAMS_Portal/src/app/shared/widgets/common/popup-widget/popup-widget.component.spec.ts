import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupWidgetComponent } from './popup-widget.component';

describe('PopupWidgetComponent', () => {
  let component: PopupWidgetComponent;
  let fixture: ComponentFixture<PopupWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
