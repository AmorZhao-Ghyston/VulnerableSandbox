namespace Web.Configuration;

public class AppOptions
{
    public const string ConfigurationKey = "VulnerableSandbox";

    public string ConnectionString { get; set; } = string.Empty;
    public string ProtectedApiKey { get; set; } = string.Empty;
}
