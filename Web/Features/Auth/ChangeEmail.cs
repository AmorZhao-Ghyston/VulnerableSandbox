using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Auth;

// CSRF vulnerable (A01): trusts the session cookie alone, no anti-forgery token.
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

            // Accept url-encoded form posts, how a cross-site auto-submitting form reaches this.
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
