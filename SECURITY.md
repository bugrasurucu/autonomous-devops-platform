# Security Policy

## Supported Versions

We actively maintain the latest version on the `main` branch. Security fixes are applied there first.

| Version | Supported |
| ------- | --------- |
| main    | ✅        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in autonomous-devops-platform, please report it responsibly:

1. **Email** the maintainers directly (see the repository owner's GitHub profile for contact details).
2. Include a description of the vulnerability, steps to reproduce, and potential impact.
3. Allow reasonable time (up to 90 days) for the issue to be assessed and patched before public disclosure.

We will acknowledge your report within 48 hours and keep you informed of progress toward a fix.

## Security Best Practices

- Never commit secrets, API keys, or credentials to the repository.
- Use the provided `.env.example` as a template; keep your `.env` file local and out of version control.
- Keep dependencies up to date and review Dependabot alerts regularly.
