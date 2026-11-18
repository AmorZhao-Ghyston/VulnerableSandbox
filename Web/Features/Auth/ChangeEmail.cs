using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// ─────────────────────────────────────────────────────────────────────────────
//  CSRF — the VULNERABLE endpoint   (OWASP 2025: A01 Broken Access Control)
// ─────────────────────────────────────────────────────────────────────────────
//  Changes the logged-in user's email. It trusts the session cookie and NOTHING
//  else — no anti-forgery token, no Origin/Referer check. Combined with the
//  SameSite=None session cookie (see AuthCookies), that means any other website
//  the victim visits can make this change on their behalf: the browser attaches
//  the cookie automatically and the server can't tell the request wasn't
//  intended.
//
//  Demo: log in on the site, then open Lunch-and-learn/csrf-attacker-page.html
//  (a different origin). Its hidden form POSTs here and your email changes.
//  Compare with ChangeEmailProtected, which the same attack cannot beat.
// ─────────────────────────────────────────────────────────────────────────────
public static class ChangeEmail
{
    public record Request(string NewEmail);

    public record Response(int Id, string Email);

    public class Endpoint(DataContext dataContext) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Post($"auth/{nameof(ChangeEmail)}");
            AllowAnonymous();

            // Accept url-encoded form posts — this is exactly how a cross-site
            // attacker's auto-submitting <form> reaches the endpoint without
            // tripping a CORS preflight. JSON bodies are still accepted too.
            AllowFormData(urlEncoded: true);
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            if (!AuthCookies.TryGetUserId(HttpContext, out var userId))
            {
                await Send.UnauthorizedAsync(cancellationToken);
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
