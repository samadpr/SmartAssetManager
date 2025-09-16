import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePictureUploadComponent } from './profile-picture-upload.component';

describe('ProfilePictureUploadComponent', () => {
  let component: ProfilePictureUploadComponent;
  let fixture: ComponentFixture<ProfilePictureUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePictureUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePictureUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
