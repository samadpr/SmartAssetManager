import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AccountService } from '../account.service';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {
constructor(
    private deviceService: DeviceDetectorService,
    private accountService: AccountService
  ) { }

  /**
   * Get all device and location information
   */
  getDeviceAndLocationInfo(): Observable<any> {
    return forkJoin({
      location: this.getGeolocation(),
      publicIP: this.accountService.getPublicIP().pipe(
        catchError(() => of({ ip: 'Not Available' }))
      ),
      deviceInfo: of(this.getDeviceInfo())
    }).pipe(
      map(result => ({
        latitude: result.location.latitude || 'Not Available',
        longitude: result.location.longitude || 'Not Available',
        publicIP: result.publicIP.ip || 'Not Available',
        browser: result.deviceInfo.browser,
        operatingSystem: result.deviceInfo.os,
        device: result.deviceInfo.deviceType
      })),
      catchError(error => {
        console.warn('Error getting device/location info:', error);
        return of({
          latitude: 'Not Available',
          longitude: 'Not Available',
          publicIP: 'Not Available',
          browser: 'Unknown',
          operatingSystem: 'Unknown',
          device: 'Unknown'
        });
      })
    );
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): any {
    const deviceInfo = this.deviceService.getDeviceInfo();
    const userAgent = navigator.userAgent;

    let deviceType = 'Unknown';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/iPad|Android|Touch/.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/Windows|Mac|Linux/.test(userAgent)) {
      deviceType = 'Desktop';
    }

    return {
      browser: deviceInfo.browser || 'Unknown',
      os: deviceInfo.os || 'Unknown',
      deviceType: deviceType
    };
  }

  /**
   * Get geolocation
   */
  private getGeolocation(): Observable<any> {
    return new Observable(observer => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            observer.next({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            });
            observer.complete();
          },
          error => {
            console.warn('Geolocation error:', error.message);
            observer.next({
              latitude: 'Not Available',
              longitude: 'Not Available'
            });
            observer.complete();
          }
        );
      } else {
        observer.next({
          latitude: 'Not Supported',
          longitude: 'Not Supported'
        });
        observer.complete();
      }
    });
  }

  /**
   * Patch form with device and location data
   */
  patchFormWithDeviceInfo(form: any): Observable<void> {
    return this.getDeviceAndLocationInfo().pipe(
      map(info => {
        form.patchValue(info);
      })
    );
  }
}
