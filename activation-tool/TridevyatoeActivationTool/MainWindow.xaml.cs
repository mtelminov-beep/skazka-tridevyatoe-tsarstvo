using Microsoft.Win32;
using System.ComponentModel;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.IO;

namespace TridevyatoeActivationTool;

public partial class MainWindow : Window, INotifyPropertyChanged
{
    private readonly LicenseSettings _settings;
    private readonly string _pfxPath;
    private string _statusMessage = "Готово.";
    private string _keyStatus = "Проверяем ключ…";

    public MainWindow()
    {
        InitializeComponent();
        DataContext = this;
        _settings = LicenseSettings.Load(AppContext.BaseDirectory);
        _pfxPath = Path.Combine(AppContext.BaseDirectory, "keys", _settings.PfxFile);
        if (!File.Exists(_pfxPath)) throw new FileNotFoundException("Не найден приватный ключ генератора.", _pfxPath);
        using var certificate = new X509Certificate2(_pfxPath, _settings.PfxPassword, X509KeyStorageFlags.EphemeralKeySet);
        KeyStatus = $"Ключ загружен: {certificate.Thumbprint}";
        ExpiresAtPicker.SelectedDate = DateTime.Today.AddYears(1);
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    public string StatusMessage { get => _statusMessage; set { _statusMessage = value; OnPropertyChanged(nameof(StatusMessage)); } }
    public string KeyStatus { get => _keyStatus; set { _keyStatus = value; OnPropertyChanged(nameof(KeyStatus)); } }

    private void GenerateButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var request = NormalizeRequestCode(RequestCodeTextBox.Text);
            if (request.Length != 64) throw new InvalidOperationException("Код запроса должен содержать 64 шестнадцатеричных символа.");
            var customer = CustomerTextBox.Text.Trim();
            if (customer.Length == 0) throw new InvalidOperationException("Укажите заказчика или объект.");
            var expiresAt = PerpetualCheckBox.IsChecked == true ? null : (ExpiresAtPicker.SelectedDate ?? throw new InvalidOperationException("Укажите дату окончания.")).Date.AddDays(1).AddSeconds(-1).ToUniversalTime().ToString("O");
            var features = FeaturesTextBox.Text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            if (features.Length == 0) throw new InvalidOperationException("Добавьте хотя бы одну функцию.");
            var payload = new { appId = _settings.AppId, deviceRequestId = request, customer, features, issuedAt = DateTimeOffset.UtcNow.ToString("O"), expiresAt, version = _settings.LicenseVersion };
            var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
            using var certificate = new X509Certificate2(_pfxPath, _settings.PfxPassword, X509KeyStorageFlags.EphemeralKeySet);
            using var rsa = certificate.GetRSAPrivateKey() ?? throw new InvalidOperationException("RSA-приватный ключ недоступен.");
            var license = new { payload = ToBase64Url(bytes), signature = ToBase64Url(rsa.SignData(bytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1)) };
            OutputTextBox.Text = JsonSerializer.Serialize(license, new JsonSerializerOptions { WriteIndented = true });
            StatusMessage = "Лицензия сгенерирована.";
        }
        catch (Exception exception) { StatusMessage = exception.Message; MessageBox.Show(this, exception.Message, "Ошибка генерации", MessageBoxButton.OK, MessageBoxImage.Warning); }
    }

    private void CopyButton_Click(object sender, RoutedEventArgs e) { if (OutputTextBox.Text.Length > 0) { Clipboard.SetText(OutputTextBox.Text); StatusMessage = "Лицензия скопирована в буфер обмена."; } }
    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        if (OutputTextBox.Text.Length == 0) return;
        var dialog = new SaveFileDialog { Filter = "JSON (*.json)|*.json", FileName = "tridevyatoe-license.json" };
        if (dialog.ShowDialog() == true) { File.WriteAllText(dialog.FileName, OutputTextBox.Text, Encoding.UTF8); StatusMessage = $"Сохранено: {dialog.FileName}"; }
    }
    private void ClearButton_Click(object sender, RoutedEventArgs e) { RequestCodeTextBox.Clear(); CustomerTextBox.Text = "Библиотека"; FeaturesTextBox.Text = "all"; OutputTextBox.Clear(); StatusMessage = "Форма очищена."; }
    private void PerpetualCheckBox_OnChanged(object sender, RoutedEventArgs e) { if (ExpiresAtPicker is not null) ExpiresAtPicker.IsEnabled = PerpetualCheckBox.IsChecked != true; }
    private static string NormalizeRequestCode(string value) => new(value.Where(Uri.IsHexDigit).Select(char.ToUpperInvariant).ToArray());
    private static string ToBase64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private void OnPropertyChanged(string name) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
