using FluentValidation;
using NodaTime;
using Web.Database;

namespace Web.Features.Comments;

// ─────────────────────────────────────────────────────────────────────────────
//  Stored XSS — the write side   (OWASP 2025: A05 Injection)
// ─────────────────────────────────────────────────────────────────────────────
//  A classic "guestbook / comments" feature. Whatever the user types is stored
//  verbatim — no sanitisation, no stripping of HTML. The danger only becomes
//  real when this content is rendered unescaped (see the frontend, which uses
//  dangerouslySetInnerHTML in its "Vulnerable" mode). Because the payload is
//  persisted, it fires for EVERY visitor who later loads the page — that is what
//  makes stored XSS worse than reflected.
//
//  Try posting:  <img src=x onerror="alert(document.cookie)">
// ─────────────────────────────────────────────────────────────────────────────
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
            // ❌ Stored verbatim. No HTML encoding / sanitising of the content.
            //    (A real fix would sanitise on input with a library like Ganss.Xss,
            //     AND encode on output — never trust one layer alone.)
            var comment = new Comment(request.Author, request.Content, clock.GetCurrentInstant());
            dataContext.Comments.Add(comment);
            await dataContext.SaveChangesAsync(cancellationToken);

            return new Response(comment.Id, comment.Author, comment.Content);
        }
    }
}
