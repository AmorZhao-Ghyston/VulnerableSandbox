using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// A deliberately trivial "login": pick an existing user by email, no password.
// It sets a session cookie (so later requests are authenticated) plus a CSRF
// token cookie. Enough to make the CSRF demo realistic without real auth.
public static class Login
{
    public record Request(string Email);

    public record Response(int Id, string Name, string Email);

    public class Endpoint(DataContext dataContext) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Post($"auth/{nameof(Login)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            var user = await dataContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            if (user is null)
            {
                await Send.UnauthorizedAsync(cancellationToken);
                return default!;
            }

            HttpContext.Response.Cookies.Append(AuthCookies.Session, user.Id.ToString(), AuthCookies.SessionOptions());
            HttpContext.Response.Cookies.Append(
                AuthCookies.CsrfToken,
                Guid.NewGuid().ToString("N"),
                AuthCookies.CsrfOptions()
            );

            return new Response(user.Id, user.Name, user.Email);
        }
    }
}
