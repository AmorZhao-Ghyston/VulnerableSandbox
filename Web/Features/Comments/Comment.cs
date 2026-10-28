using NodaTime;

namespace Web.Features.Comments;

public class Comment(string author, string content, Instant createdAt)
{
    public int Id { get; private set; }
    public string Author { get; private set; } = author;
    public string Content { get; private set; } = content;
    public Instant CreatedAt { get; private set; } = createdAt;
}
