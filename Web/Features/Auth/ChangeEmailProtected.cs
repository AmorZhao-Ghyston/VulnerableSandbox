using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// CSRF fixed (A01): double-submit token the caller echoes in a header, which an attacker cannot read.
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

            // Double-submit check: header must equal the CSRF cookie.
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
