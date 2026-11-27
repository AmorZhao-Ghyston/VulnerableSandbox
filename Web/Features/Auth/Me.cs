using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// Current user from the session cookie; shows the CSRF attack's effect.
public static class Me
{
    public record Response(int Id, string Name, string Email);

    public class Endpoint(DataContext dataContext) : EndpointWithoutRequest<Response>
    {
        public override void Configure()
        {
            Get($"auth/{nameof(Me)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(CancellationToken cancellationToken)
        {
            if (
                !HttpContext.Request.Cookies.TryGetValue(AuthCookies.Session, out var raw)
                || !int.TryParse(raw, out var userId)
            )
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

            return new Response(user.Id, user.Name, user.Email);
        }
    }
}
