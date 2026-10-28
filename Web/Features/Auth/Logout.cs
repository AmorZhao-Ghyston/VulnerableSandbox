namespace Web.Features.Auth;

// Clears the session + CSRF cookies. Handy for resetting the CSRF demo.
public static class Logout
{
    public class Endpoint : EndpointWithoutRequest
    {
        public override void Configure()
        {
            Post($"auth/{nameof(Logout)}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken cancellationToken)
        {
            HttpContext.Response.Cookies.Delete(AuthCookies.Session, AuthCookies.SessionOptions());
            HttpContext.Response.Cookies.Delete(AuthCookies.CsrfToken, AuthCookies.CsrfOptions());
            await Send.OkAsync(cancellation: cancellationToken);
        }
    }
}
