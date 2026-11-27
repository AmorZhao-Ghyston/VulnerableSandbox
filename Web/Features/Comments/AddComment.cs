using FluentValidation;
using NodaTime;
using Web.Database;

namespace Web.Features.Comments;

// Stored XSS write side (A05): comments saved exactly as typed, no sanitising.
public static class AddComment
{
    public record Request(string Author, string Content);

    public record Response(int Id, string Author, string Content);

    public class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Author).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
        }
    }

    public class Endpoint(DataContext dataContext, ZonedClock clock) : Endpoint<Request, Response>
    {
        public override void Configure()
        {
            Post($"comment/{nameof(AddComment)}");
            AllowAnonymous();
        }

        public override async Task<Response> ExecuteAsync(Request request, CancellationToken cancellationToken)
        {
            // Stored verbatim, no HTML encoding or sanitising.
            var comment = new Comment(request.Author, request.Content, clock.GetCurrentInstant());
            dataContext.Comments.Add(comment);
            await dataContext.SaveChangesAsync(cancellationToken);

            return new Response(comment.Id, comment.Author, comment.Content);
        }
    }
}
