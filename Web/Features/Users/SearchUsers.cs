using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Users;

public static class SearchUsers
{
    public record Request(string Query);

    public record Response(ICollection<Response.UserResult> Users)
    {
        public record UserResult(int Id, string Name, string Email);
    }

    public class Endpoint(DataContext dataContext) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Get($"user/{nameof(SearchUsers)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            // Intentionally vulnerable to SQL injection: raw string concatenation, no parameterisation.
            var sql = "SELECT Id, Name, Email, CreatedAt FROM Users WHERE Name LIKE '%" + request.Query + "%'";

            var users = await dataContext.Users.FromSqlRaw(sql).ToListAsync(cancellationToken);

            return new Response(users.Select(u => new Response.UserResult(u.Id, u.Name, u.Email)).ToList());
        }
    }
}
