import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevelopingProcessPageComponent } from './developing-process-page.component';

describe('DevelopingProcessPageComponent', () => {
  let component: DevelopingProcessPageComponent;
  let fixture: ComponentFixture<DevelopingProcessPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevelopingProcessPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevelopingProcessPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
