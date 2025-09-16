import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AccountService } from '../account.service';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {
  constructor(
    private deviceService: DeviceDetectorService,
    private accountService: AccountService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getDeviceAndLocationInfo(): Observable<any> {
    return forkJoin({
      location: this.getGeolocation(),                                      // always returns an object (fallbacks handled)
      publicIP: this.accountService.getPublicIP().pipe(                     // may be string or object
        catchError(() => of(null))
      ),
      deviceInfo: of(this.getDeviceInfo())                                  // synchronous safe value
    }).pipe(
      map(result => {
        // Normalize publicIP: support either { ip: 'x' } or 'x' or null
        let publicIPValue = 'Not Available';
        if (result.publicIP) {
          if (typeof result.publicIP === 'string') {
            publicIPValue = result.publicIP || 'Not Available';
          } else if ('ip' in result.publicIP) {
            publicIPValue = result.publicIP.ip || 'Not Available';
          } else {
            // any other shape
            publicIPValue = JSON.stringify(result.publicIP) || 'Not Available';
          }
        }

        return {
          latitude: result.location?.latitude ?? 'Not Available',
          longitude: result.location?.longitude ?? 'Not Available',
          publicIP: publicIPValue,
          browser: result.deviceInfo?.browser ?? 'Unknown',
          operatingSystem: result.deviceInfo?.os ?? 'Unknown',
          device: result.deviceInfo?.deviceType ?? 'Unknown'
        };
      }),
      catchError(err => {
        console.warn('DeviceInfoService.getDeviceAndLocationInfo error:', err);
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

  private getDeviceInfo(): any {
    // Only call ngx-device-detector and navigator when in browser
    if (isPlatformBrowser(this.platformId)) {
      // deviceService.getDeviceInfo() may use navigator internally — safe now
      const deviceInfo = this.deviceService.getDeviceInfo() || {};
      const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';

      let deviceType = 'Unknown';
      if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
      else if (/tablet/i.test(userAgent) || /iPad|Android|Touch/.test(userAgent)) deviceType = 'Tablet';
      else if (/Windows|Mac|Linux/.test(userAgent)) deviceType = 'Desktop';

      return {
        browser: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        deviceType
      };
    }

    // server fallback
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'Server'
    };
  }

  private getGeolocation(): Observable<any> {
    return new Observable(observer => {
      if (isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            observer.next({
              latitude: pos.coords.latitude.toString(),
              longitude: pos.coords.longitude.toString()
            });
            observer.complete();
          },
          error => {
            console.warn('Geolocation error:', error?.message || error);
            observer.next({ latitude: 'Not Available', longitude: 'Not Available' });
            observer.complete();
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,   // 30 seconds
            maximumAge: 0
          } // optional: avoid waiting forever
        );
      } else {
        observer.next({ latitude: 'Not Supported', longitude: 'Not Supported' });
        observer.complete();
      }
    });
  }

  // return observable so caller can wait for completion / subscribe
  patchFormWithDeviceInfo(form: any): Observable<void> {
    return this.getDeviceAndLocationInfo().pipe(
      tap(info => form.patchValue(info)),
      map(() => void 0) // convert to Observable<void>
    );
  }
}
