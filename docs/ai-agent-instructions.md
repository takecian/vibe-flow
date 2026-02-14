# AI Agent Instructions

This document explains the various agent instruction files in the repository and their purposes.

## File Overview

### `.github/copilot-instructions.md`

**Purpose**: Custom instructions for GitHub Copilot  
**Read by**: GitHub Copilot (the AI pair programmer integrated in VS Code, GitHub.com, etc.)  
**When**: Automatically read by Copilot when providing code suggestions  
**Location**: Must be in `.github/` directory to be recognized

This is the **primary file that GitHub Copilot reads** to understand repository conventions, structure, and best practices. It helps Copilot provide more accurate and contextually appropriate code suggestions.

### `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`

**Purpose**: Repository context for other AI coding assistants  
**Read by**: Other AI tools like Claude, Gemini, or custom agents  
**When**: When these tools are explicitly pointed to these files  
**Location**: Root directory for easy discovery

These files contain the same repository summary and are intended for use with standalone AI coding assistants that may be configured to read specific instruction files from the repository root.

## Which File Does Copilot Read First?

**GitHub Copilot reads `.github/copilot-instructions.md` first** (and exclusively, as it doesn't automatically read other instruction files).

The files in the root directory (AGENTS.md, CLAUDE.md, GEMINI.md) are **not read by GitHub Copilot**. They are intended for other AI tools and workflows.

## Best Practices

1. **For GitHub Copilot users**: Keep `.github/copilot-instructions.md` updated with:
   - Repository architecture overview
   - Coding conventions and style guidelines
   - Key dependencies and patterns
   - Links to detailed documentation

2. **For other AI tools**: Use the root-level instruction files (AGENTS.md, etc.) or configure your tools to read `.github/copilot-instructions.md` for consistency.

3. **Keep them in sync**: When updating repository conventions or architecture, update all relevant instruction files to maintain consistency across different AI tools.

## References

- [GitHub Copilot Instructions Documentation](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
