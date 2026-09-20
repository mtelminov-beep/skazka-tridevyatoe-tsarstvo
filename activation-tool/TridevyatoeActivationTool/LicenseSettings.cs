using System.Text.Json;
using System.IO;

namespace TridevyatoeActivationTool;

internal sealed class LicenseSettings
{
    public string AppId { get; init; } = "ru.tridevyatoe.skazki";
    public int LicenseVersion { get; init; } = 1;
    public string PfxFile { get; init; } = "tridevyatoe-license-signing.pfx";
    public string PfxPassword { get; init; } = string.Empty;

    public static LicenseSettings Load(string baseDirectory)
    {
        var path = Path.Combine(baseDirectory, "keys", "license-settings.json");
        if (!File.Exists(path)) throw new FileNotFoundException("Не найден файл настроек ключа.", path);
        return JsonSerializer.Deserialize<LicenseSettings>(File.ReadAllText(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidDataException("Не удалось прочитать настройки ключа.");
    }
}
