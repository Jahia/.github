# Jahia Copilot Instructions

These instructions apply to Jahia Core (in repositories: Jahia/jahia-private, Jahia/jahia-pack-private, Jahia/jahia-ee) as well as Jahia modules and bundles (repositories containing a "pom.xml" at their root).

Other repositories are exempt from most of these instructions.

## Project Overview

## Code Review Guidelines

### Architecture

TO BE COMPLETED

### Testing Standards

All new features and bug fixes should have automated tests (integration-tests) built in Cypress and covering the code being modified. This requirement only cover modification to the product's codebase only (most of the time in src/ folder), changes to CI, documentation, ... do not require automated tests.

If a bug is fixed or new feature is introduced but decision was made not to implement identified test cases, a placeholder test case using the "skip()" argument should be present. It helps the team understand known functional coverage gaps. These skipped test should include a comment detailing the test case to be implemented.

### CI/CD

Any new CI/CD workflows created should use a [re-usable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) located in [Jahia/jahia-modules-action](https://github.com/Jahia/jahia-modules-action).

Execution of automated tests should follow these guidelines:
 - Run tests nightly towards the latest release version of Jahia, this makes sure that we are not introducing in the module and by mistake, incompatibilities with previous releases of Jahia
 - Run tests nightly towards the latest snapshot version of Jahia, this makes sure that we will be alerted if a change in Jahia core is breaking compatibility with a module
 - Run tests on merge towards the latest release version of Jahia, this avoid waiting for the nightly execution to detect issues
 - Run tests on pull request towards the latest snapshot version of Jahia, these tests must pass before a PR can be merged.

### Security

No sensitive data should be exposed in the code or in the pull request description.

### Pull Request Requirements

With the exception of trivial changes:
- PR should be attached to a parent issue (using "Development" field)
- PR should be attached to a project
- The PR description should not reference customer tickets, customer tickets should only be present in the "Jira Tickets" field of the Project attached to the PR.
- Since most Jahia codebases are Open Source and some private codebases might become Open Source in the future, ensure the description is intelligible and public facing.

