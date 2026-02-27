import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsIssueComponent } from './assets-issue.component';

describe('AssetsIssueComponent', () => {
  let component: AssetsIssueComponent;
  let fixture: ComponentFixture<AssetsIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsIssueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
