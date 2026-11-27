using Microsoft.EntityFrameworkCore;
using Web.Database;

namespace Web.Features.Comments;

// Returns stored comments verbatim; the XSS fires client-side when they are rendered.
public static class GetComments
{
    public record Response(ICollection<Response.CommentResult> Comments)
    {
        public record CommentResult(int Id, string Author, string Content);
    }

    public class Endpoint(DataContext dataContext) : EndpointWithoutRequest<Response>
    {
        public override void Configure()
        {
            Get($"comment/{nameof(GetComments)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(CancellationToken cancellationToken)
        {
            var comments = await dataContext
                .Comments.OrderByDescending(c => c.Id)
                .Select(c => new Response.CommentResult(c.Id, c.Author, c.Content))
                .ToListAsync(cancellationToken);

            return new Response(comments);
        }
    }
}
