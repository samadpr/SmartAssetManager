import { environment } from '../../../environments/environment.development';

export class FileUrlHelper {

  /**
   * Returns full accessible URL for a given relative file path.
   *
   * @param relativePath File path returned from backend (may be relative or absolute)
   * @returns Full URL or empty string
   */
  static getFullUrl(relativePath: string | null | undefined): string {
    if (!relativePath || relativePath.trim() === '') {
      return '';
    }

    // Already full URL?
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Remove leading slash if exists
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    const fullUrl = `${environment.assetBaseUrl}/${cleanPath}`;

    // Debugging log
    // console.log('🔗 File URL:', { relativePath, fullUrl });

    return fullUrl;
  }
}
