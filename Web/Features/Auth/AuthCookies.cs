namespace Web.Features.Auth;

// Shared cookie plumbing for the CSRF demo.
//
// The vulnerability being demonstrated is the SESSION cookie's SameSite=None
// setting: it tells the browser to attach the cookie even on cross-site
// requests, which is exactly what lets an attacker's page act as the logged-in
// user. A real app would use SameSite=Lax/Strict AND an anti-forgery token.
public static class AuthCookies
{
    public const string Session = "vs_session"; // holds the logged-in user id
    public const string CsrfToken = "vs_csrf"; // double-submit token (readable by JS)

    // ❌ VULNERABLE cookie policy: SameSite=None means "send me cross-site too".
    public static CookieOptions SessionOptions() =>
        new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
        };

    // The CSRF token is intentionally readable by same-origin JS (not HttpOnly)
    // so the legitimate frontend can echo it back in a header (double-submit).
    // A cross-origin attacker cannot read it, which is what makes the fix work.
    public static CookieOptions CsrfOptions() =>
        new()
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
        };

    // Reads the logged-in user id from the session cookie.
    public static bool TryGetUserId(HttpContext context, out int userId)
    {
        userId = 0;
        return context.Request.Cookies.TryGetValue(Session, out var raw) && int.TryParse(raw, out userId);
    }
}
