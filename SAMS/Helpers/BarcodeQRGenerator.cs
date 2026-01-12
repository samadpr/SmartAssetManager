using BarcodeStandard;
using QRCoder;
using SkiaSharp;

namespace SAMS.Helpers
{
    public class BarcodeQRGenerator
    {
        private readonly ILogger<BarcodeQRGenerator> _logger;
        public BarcodeQRGenerator(ILogger<BarcodeQRGenerator> logger)
        {
            _logger = logger;
        }

        public string GenerateBarcode(string data)
        {
            try
            {
                if (string.IsNullOrEmpty(data))
                    return GetDefaultBarcode();

                var barcode = new Barcode
                {
                    IncludeLabel = true
                };

                var skImage = barcode.Encode(
                    BarcodeStandard.Type.Code128,
                    data,
                    SKColors.Black,
                    SKColors.White,
                    290,
                    120
                );

                var skData = skImage.Encode(SKEncodedImageFormat.Png, 20);
                using var frameStream = skData.AsStream();
                using var ms = new MemoryStream();
                frameStream.CopyTo(ms);

                var imageBytes = ms.ToArray();
                return "data:image/png;base64," + Convert.ToBase64String(imageBytes, Base64FormattingOptions.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating barcode for data: {Data}", data);
                return GetDefaultBarcode();
            }
        }

        public string GenerateQRCode(string data)
        {
            try
            {
                if (string.IsNullOrEmpty(data))
                    return GetDefaultQRCode();

                using var qrGenerator = new QRCodeGenerator();
                using var qrCodeData = qrGenerator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new Base64QRCode(qrCodeData);

                var qrCodeImageAsBase64 = qrCode.GetGraphic(20);
                return "data:image/png;base64," + qrCodeImageAsBase64;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code for data: {Data}", data);
                return GetDefaultQRCode();
            }
        }

        public static string GenerateAssetId(long maxId)
        {
            var nextId = maxId + 1;
            var datePrefix = DateTime.Now.ToString("yyyyMMdd");
            return $"{datePrefix}{nextId:D6}";
        }

        public static string RandomDigits(int length)
        {
            var random = new Random();
            return string.Concat(Enumerable.Range(0, length).Select(_ => random.Next(10)));
        }

        private string GetDefaultBarcode()
        {
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        }

        private string GetDefaultQRCode()
        {
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        }
    }
}
