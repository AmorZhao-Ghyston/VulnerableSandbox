/* ============================================================================
   Vulnerable Sandbox — database setup
   ----------------------------------------------------------------------------
   Run this ONCE against the SQL Server container (as the 'sa' login) after the
   container is up. It is re-runnable: it drops and recreates both databases.

   It creates:
     • VulnerableSandbox      (dev)  + login/user, schema, 11 seeded users
     • VulnerableSandboxTest  (test) + login/user, schema (no seed data —
                                       the integration tests seed their own and
                                       Respawn resets between tests)

   The logins/passwords/ports match:
     • Web/appsettings.Development.json
     • Web/appsettings.IntegrationTest.json

   Example (from the repo root, with the container running):
     docker exec -i VulnerableSandbox_Database /opt/mssql-tools18/bin/sqlcmd \
       -S localhost -U sa -P 'SuperSecure0!' -C -i /dev/stdin < Database/setup.sql
   or with a local sqlcmd:
     sqlcmd -S localhost,1407 -U sa -P 'SuperSecure0!' -C -i Database/setup.sql
   ============================================================================ */

/* ---------- Development database ------------------------------------------ */

IF DB_ID('VulnerableSandbox') IS NOT NULL
BEGIN
    ALTER DATABASE [VulnerableSandbox] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [VulnerableSandbox];
END
GO

CREATE DATABASE [VulnerableSandbox];
GO

IF SUSER_ID('VulnerableSandbox') IS NOT NULL
    DROP LOGIN [VulnerableSandbox];
GO

CREATE LOGIN [VulnerableSandbox]
    WITH PASSWORD = 'DefinitelyDurable1!',
         DEFAULT_DATABASE = [VulnerableSandbox],
         CHECK_EXPIRATION = OFF,
         CHECK_POLICY = OFF;
GO

USE [VulnerableSandbox];
GO

CREATE USER [VulnerableSandbox] FOR LOGIN [VulnerableSandbox];
ALTER ROLE db_datareader ADD MEMBER [VulnerableSandbox];
ALTER ROLE db_datawriter ADD MEMBER [VulnerableSandbox];
ALTER ROLE db_ddladmin  ADD MEMBER [VulnerableSandbox];
GO

CREATE TABLE Users (
    Id        INT IDENTITY(1000,1) PRIMARY KEY,
    Name      NVARCHAR(MAX) NOT NULL,
    Email     NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME      NOT NULL
);
GO

INSERT INTO Users (Name, Email, CreatedAt) VALUES
    ('Alice Johnson',  'alice.johnson@acme.corp',  GETUTCDATE()),
    ('Bob Mitchell',   'bob.mitchell@acme.corp',   GETUTCDATE()),
    ('Carol Davies',   'carol.davies@acme.corp',   GETUTCDATE()),
    ('David Huang',    'david.huang@acme.corp',    GETUTCDATE()),
    ('Emma Wilson',    'emma.wilson@acme.corp',    GETUTCDATE()),
    ('Frank Okafor',   'frank.okafor@acme.corp',   GETUTCDATE()),
    ('Grace Kim',      'grace.kim@acme.corp',      GETUTCDATE()),
    ('Henry Patel',    'henry.patel@acme.corp',    GETUTCDATE()),
    ('Isabel Santos',  'isabel.santos@acme.corp',  GETUTCDATE()),
    ('James Thornton', 'james.thornton@acme.corp', GETUTCDATE()),
    ('admin',          'admin@acme.corp',          GETUTCDATE());
GO

/* ---------- Test database (schema only) ----------------------------------- */

IF DB_ID('VulnerableSandboxTest') IS NOT NULL
BEGIN
    ALTER DATABASE [VulnerableSandboxTest] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [VulnerableSandboxTest];
END
GO

CREATE DATABASE [VulnerableSandboxTest];
GO

IF SUSER_ID('VulnerableSandboxTest') IS NOT NULL
    DROP LOGIN [VulnerableSandboxTest];
GO

CREATE LOGIN [VulnerableSandboxTest]
    WITH PASSWORD = 'TotallyTrusted2!',
         DEFAULT_DATABASE = [VulnerableSandboxTest],
         CHECK_EXPIRATION = OFF,
         CHECK_POLICY = OFF;
GO

USE [VulnerableSandboxTest];
GO

CREATE USER [VulnerableSandboxTest] FOR LOGIN [VulnerableSandboxTest];
ALTER ROLE db_datareader ADD MEMBER [VulnerableSandboxTest];
ALTER ROLE db_datawriter ADD MEMBER [VulnerableSandboxTest];
ALTER ROLE db_ddladmin  ADD MEMBER [VulnerableSandboxTest];
GO

CREATE TABLE Users (
    Id        INT IDENTITY(1000,1) PRIMARY KEY,
    Name      NVARCHAR(MAX) NOT NULL,
    Email     NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME      NOT NULL
);
GO
