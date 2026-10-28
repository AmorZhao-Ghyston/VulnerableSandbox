using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// ─────────────────────────────────────────────────────────────────────────────
//  CSRF — the FIXED endpoint   (OWASP 2025: A01 Broken Access Control)
// ─────────────────────────────────────────────────────────────────────────────
//  Same action, but it requires a double-submit anti-forgery token: the caller
//  must send the vs_csrf cookie's value back in an X-CSRF-TOKEN header, and the
//  two must match. The legitimate frontend can do this (it can read its own
//  cookie via JavaScript, same-origin). A cross-origin attacker CANNOT read the
//  victim's cookie, so it can't produce the header — the forged request is
//  rejected even though the session cookie still rides along.
//
//  (SameSite=Lax/Strict on the session cookie is the other half of the fix;
//   either one alone defeats this attack, and real apps use both.)
// ─────────────────────────────────────────────────────────────────────────────
public static class ChangeEmailProtected
{
    public record Request(string NewEmail);

    public record Response(int Id, string Email);

    public class Endpoint(DataContext dataContext) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Post($"auth/{nameof(ChangeEmailProtected)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            if (!AuthCookies.TryGetUserId(HttpContext, out var userId))
            {
                await Send.UnauthorizedAsync(cancellationToken);
                return default!;
            }

            // ✅ Double-submit check: header must equal the CSRF cookie.
            var headerToken = HttpContext.Request.Headers["X-CSRF-TOKEN"].ToString();
            HttpContext.Request.Cookies.TryGetValue(AuthCookies.CsrfToken, out var cookieToken);
            if (string.IsNullOrEmpty(headerToken) || string.IsNullOrEmpty(cookieToken) || headerToken != cookieToken)
            {
                await Send.ForbiddenAsync(cancellationToken);
                return default!;
            }

            var user = await dataContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                await Send.UnauthorizedAsync(cancellationToken);
                return default!;
            }

            user.ChangeEmail(request.NewEmail);
            await dataContext.SaveChangesAsync(cancellationToken);

            return new Response(user.Id, user.Email);
        }
    }
}
