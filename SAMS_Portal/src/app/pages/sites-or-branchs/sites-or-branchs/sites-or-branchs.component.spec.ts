import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesOrBranchsComponent } from './sites-or-branchs.component';

describe('SitesOrBranchsComponent', () => {
  let component: SitesOrBranchsComponent;
  let fixture: ComponentFixture<SitesOrBranchsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesOrBranchsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitesOrBranchsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
