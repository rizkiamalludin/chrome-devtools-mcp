# Security Policy

## Supported use

This server is intended for supervised browsing of public websites and read-only inspection.

## Safety boundaries

- Only HTTP and HTTPS URLs are accepted.
- Localhost, private IP literals, and common internal hostnames are blocked.
- Browser navigation requests are checked before they are allowed.
- The initial tool set can inspect pages and click visible links only. It does not expose arbitrary JavaScript execution, form submission, credential entry, downloads, or payment actions.
- Browserbase API credentials and CDP connection URLs must remain server-side and are never returned by tools.
- Remote HTTP mode requires a bearer token of at least 32 characters.
- Keep the server private. Do not publish an unauthenticated MCP endpoint.

These checks reduce risk but are not a substitute for network-level egress controls. Do not use this project to access private accounts, sensitive personal information, or websites where you do not have permission.

## Reporting

Do not publish API keys, bearer tokens, session connection URLs, screenshots containing personal information, or browser session identifiers in public issues. Rotate any credential that may have been exposed.

For a security report, contact the repository owner privately through GitHub's supported security reporting channel.
