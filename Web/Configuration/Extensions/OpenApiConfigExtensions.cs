using System.Reflection;
using FastEndpoints.Swagger;
using NJsonSchema.Generation;

namespace Web.Configuration.Extensions;

public static class OpenApiConfigExtensions
{
    public static void ConfigureSwaggerDocument(this IServiceCollection serviceCollection)
    {
        serviceCollection.SwaggerDocument(o =>
        {
            o.DocumentSettings = s =>
            {
                s.DocumentName = "v1";
                s.Title = "Vulnerable Sandbox";
                s.Version = "v1";

                s.MarkNonNullablePropsAsRequired();

                s.SchemaSettings.DefaultReferenceTypeNullHandling = ReferenceTypeNullHandling.NotNull;
                s.SchemaSettings.SchemaNameGenerator = new CustomSchemaNameGenerator();
            };
        });
    }

    private sealed class CustomSchemaNameGenerator : ISchemaNameGenerator
    {
        public string Generate(Type type)
        {
            return GetName(type);
        }

        private static string GetName(MemberInfo x)
        {
            return x.DeclaringType is null ? x.Name : $"{GetName(x.DeclaringType)}{x.Name}";
        }
    }
}
