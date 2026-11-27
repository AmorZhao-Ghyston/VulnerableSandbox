using System.Net;
using System.Net.Sockets;

// Fetching a user-supplied URL is the SSRF; the URI analyzers do not apply here.
#pragma warning disable CA1054, CA1056, CA2234

namespace Web.Features.Demo;

// SSRF (A01): server fetches a user-supplied URL and can reach internal targets. Safe=true is the fix.
public static class FetchUrlPreview
{
    public record Request(string Url, bool Safe = false);

    public record Response(int StatusCode, string ContentType, string Body);

    public class Endpoint(IHttpClientFactory httpClientFactory) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Get($"demo/{nameof(FetchUrlPreview)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            if (request.Safe && await IsBlockedAsync(request.Url, cancellationToken) is { } reason)
            {
                await Send.StringAsync($"Blocked by SSRF protection: {reason}", 403, cancellation: cancellationToken);
                return default!;
            }

            using var client = httpClientFactory.CreateClient("ssrf");

            // Safe=false fetches any URL; Safe=true only reaches here after the checks.
            using var upstream = await client.GetAsync(request.Url, cancellationToken);

            var body = await upstream.Content.ReadAsStringAsync(cancellationToken);
            var preview = body.Length > 2000 ? body[..2000] + "…(truncated)" : body;

            return new Response((int)upstream.StatusCode, upstream.Content.Headers.ContentType?.ToString() ?? "", preview);
        }

        // Returns a reason to block, or null to allow.
        private static async Task<string?> IsBlockedAsync(string url, CancellationToken cancellationToken)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                return "not a valid absolute URL";
            }

            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            {
                return $"scheme '{uri.Scheme}' is not allowed (only http/https)";
            }

            IPAddress[] addresses;
            try
            {
                addresses = await Dns.GetHostAddressesAsync(uri.Host, cancellationToken);
            }
            catch (SocketException)
            {
                return $"could not resolve host '{uri.Host}'";
            }

            foreach (var address in addresses)
            {
                if (IsPrivate(address))
                {
                    return $"host resolves to a private/internal address ({address})";
                }
            }

            return null;
        }

        private static bool IsPrivate(IPAddress address)
        {
            if (IPAddress.IsLoopback(address))
            {
                return true;
            }

            if (address.AddressFamily == AddressFamily.InterNetwork)
            {
                var b = address.GetAddressBytes();
                return b[0] == 10 // 10.0.0.0/8
                    || (b[0] == 172 && b[1] >= 16 && b[1] <= 31) // 172.16.0.0/12
                    || (b[0] == 192 && b[1] == 168) // 192.168.0.0/16
                    || (b[0] == 169 && b[1] == 254); // 169.254.0.0/16 (link-local / cloud metadata)
            }

            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                return address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6UniqueLocal;
            }

            return false;
        }
    }
}
