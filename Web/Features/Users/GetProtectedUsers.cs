using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Web.Configuration;
using Web.Database;

namespace Web.Features.Users;

public static class GetProtectedUsers
{
    public record Request(string ApiKey);

    public record Response(ICollection<Response.UserResult> Users)
    {
        public record UserResult(int Id, string Name, string Email);
    }

    public class Endpoint(DataContext dataContext, IOptions<AppOptions> options) : Endpoint<Request, Response>
    {
        private readonly AppOptions appOptions = options.Value;

        public override void Configure()
        {
            Get($"user/{nameof(GetProtectedUsers)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            if (request.ApiKey != appOptions.ProtectedApiKey)
            {
                await Send.UnauthorizedAsync(cancellationToken);
                return default!;
            }

            var users = await dataContext
                .Users.OrderBy(u => u.Id)
                .Select(u => new Response.UserResult(u.Id, u.Name, u.Email))
                .ToListAsync(cancellationToken);

            return new Response(users);
        }
    }
}
