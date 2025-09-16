import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListWidgetComponent } from './list-widget.component';

describe('ListWidgetComponent', () => {
  let component: ListWidgetComponent;
  let fixture: ComponentFixture<ListWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
