using server_portal.Hubs;
using server_portal.Services;

namespace server_portal
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure Kestrel for large file uploads
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Limits.MaxRequestBodySize = 2_147_483_648; // 2GB
            });

            builder.Services.AddControllers();
            builder.Services.AddSignalR();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddSingleton<DockerComposeService>();
            builder.Services.AddSingleton<LogStreamer>();
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // Configure form options for large files
            builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 2_147_483_648; // 2GB
                options.ValueLengthLimit = int.MaxValue;
                options.MultipartHeadersLengthLimit = int.MaxValue;
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors();
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapHub<LogsHub>("/hubs/logs");
            app.MapControllers();
            app.Run();
        }
    }
}
