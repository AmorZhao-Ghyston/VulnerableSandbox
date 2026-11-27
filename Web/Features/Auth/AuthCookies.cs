namespace Web.Features.Auth;

// Cookie plumbing for the CSRF demo. The flaw is the session cookie's SameSite=None.
public static class AuthCookies
{
    public const string Session = "vs_session"; // holds the logged-in user id
    public const string CsrfToken = "vs_csrf"; // double-submit token (readable by JS)

    // Vulnerable policy: SameSite=None sends the cookie cross-site too.
    public static CookieOptions SessionOptions() =>
        new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
        };

    // Not HttpOnly so same-origin JS can echo it back; an attacker cannot read it.
    public static CookieOptions CsrfOptions() =>
        new()
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
        };

    public static bool TryGetUserId(HttpContext context, out int userId)
    {
        userId = 0;
        return context.Request.Cookies.TryGetValue(Session, out var raw) && int.TryParse(raw, out userId);
    }
}
