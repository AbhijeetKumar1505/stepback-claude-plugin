# Security and privacy notes

- The plugin has no MCP server, network dependency, telemetry, or secret configuration.
- The hook reads the JSON event from stdin and writes a small JSON advisory to stdout. It does not read project files, environment variables, git state, or arbitrary paths.
- The hook uses Node.js built-ins only and fails open on malformed input.
- Subagents are read-only by instruction. They should not be granted write tools for analysis-only tasks where the host supports tool restrictions.
- Recommendations must not expose secrets found in project context. Do not paste credentials into reports.
- Review all plugin source before installation, especially hooks and scripts.
