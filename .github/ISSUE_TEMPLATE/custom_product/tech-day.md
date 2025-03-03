---
name: Tech Day
about: Create a tech day ticket
title: ''
type: Task
labels: ['Tech Day', 'Area:Tech']

---

The goal of this ticket is to work on technical debt for a repository within a fixed time window of 1 day.

## Organizing of your day

One day will NOT be sufficient to address technical debt for the codebase, organizing your day is key to wrap-up the tasks with concrete deliverable.

We recommend following this schedule:
- Begin by spending 1 hour to go over the checklist attached to this ticket, identify activities you would be able to complete within the day and create tickets for activities that would require more work or that you don't expect to complete. Make sure to link these new ticket to the techday ticket and to attach it to the checklist.
- Work on items identified during the first hour.
- Wrap up your day by spending 1 hour to document the changes you did, provide instructions for testing and eventually to give pointers to the next person working on a techday ticket for this codebase.

## Create tickets for future work
Not all tech debt items can be addressed within a day, the goal of this day is also to raise awareness about tech debt to be tackled in the future.

If you see a non-compliant element but you didn't get a chance to work on it, please create the corresponding ticket, attach it to the next fixVersion of the codebase and link it in this ticket.

Please fill the checklist available in this ticket, priorities are available as a guideline as to what we consider more or less important for each of the tech areas:

🚨 Indicates a required item, to be looked at during the day
🔝 Indicates a top priority item
🟠 Indicates a medium priority item
🙏 Indicates a low priority item

## Tech day checklist

This checklist is focused on a classic Jahia repository (module, app)

### General
- [ ] 🚨 I reviewed all OPEN TECH tickets created for that codebase (using codebase-X.Y.Z milestone)
- [ ] 🚨 I reviewed older tech day tickets for that codebase
- [ ] 🟠 Standards have been discussed in a tech kumite in the past semester
### Dependency management
- [ ] 🔝 I've identified the process/tools to handle dependency updates (ex: [renovate](https://jahia-confluence.atlassian.net/wiki/spaces/PR/pages/2071358/3rd-party+libraries+-+Ref+ISPOL08.A14024#%5BinlineExtension%5DRenovate))
- [ ] 🙏 Remove unused libraries
### Javascript
- [ ] 🔝 The module's webpack config is correct ([sample](https://github.com/Jahia/jcontent/blob/master/webpack.config.js))
- [ ] 🔝 The module is using a supported LTS version of ([NodeJS](https://nodejs.org/en/about/previous-releases))
- [ ] 🟠 The module is using React v18+
- [ ] 🟠 The module is using Moonstone v2+
- [ ] 🟠 The module is not using any of the following Jahia's legacy libs:
  * react-material
  * moonstone-alpha
- [ ] 🔝 Dependencies listed in packages.json are still maintained (latest release not older than 6 months)
- [ ] 🟠 Dependencies listed in packages.json are no more than 2 major versions behind their latest release
- [ ] 🟠 Linting is executed properly and show no warnings
- [ ] 🟠 No warning are presents in the browser console when using the app
- [ ] 🙏 Remove unreachable code
### Java
- [ ] 🔝 Java dependencies are explicitly declared in the module's pom.xml
- [ ] 🔝 Spring is not used in the module
- [ ] 🔝 No warnings or errors are present when building the module locally or on GitHub Actions
- [ ] 🟠 No code smell on [Sonarqube](https://sonarqube.jahia.com/projects) for the module
- [ ] 🙏 Remove unreachable code
### Security
- [ ] 🔝 Review the [security vulnerabilities](ndency-track-prod.jahia.com/projects) affecting this codebase and discuss with the Security lead before taking action (Create a [SECURITY](https://support.jahia.com/browse/SECURITY) ticket, Close as false-positive, etc.)
### QA
- [ ] 🔝 Automated tests are using jahia-cypress for all utils functions
- [ ] 🔝 The test framework is using page-object models published by other modules
- [ ] 🔝 The test framework is publishing its own page-object models for use by others
- [ ] 🟠 A manual-run workflow is available
- [ ] 🙏 Automated tests are using a recent version of Cypress
- [ ] 🙏 Automated tests are only relying on supported modules
### CI/CD
- [ ] 🔝 The build and the release workflows use the JDK 11 image (only if Jahia Parent is set to 8.2.0.0+)
- [ ] 🔝 GitHub Actions (nightlys and other workflows) are executed without warnings (such as depreciations)
- [ ] 🙏 The latest version of the actions are used (including jahia-modules-action)
- [ ] 🙏 The [reusable workflows](https://github.com/Jahia/jahia-modules-action/tree/main/.github/workflows) are used
### Documentation
- [ ] 🔝 Readme.md is up-to-date (module purpose, technical details, configuration steps)
- [ ] 🟠 A tech roadmap is available 
- [ ] 🙏 Module's documentation available on the academy is up-to-date
### Issues
- [ ] 🟠 If the repository is public, review the issues/pull requests from the community and give feedback
### GitHub
- [ ] 🟠 [Branch protection](https://confluence.jahia.com/display/PR/GitHub+%28Product%29+-+Ref+ISPOL08.A14025#GitHub(Product)RefISPOL08.A14025-Branchprotection) is enabled for the repository
- [ ] **Automatically delete head branches** is selected in **Settings**
- [ ] 🙏 Repository topics match are populated (at a minimum: "product" and "supported")
- [ ] 🙏 Stale branches or branches older than 2 years (non-maintenance branches) have been removed

## Fork day checklist

This checklist is focused on our forked repositories

### General
- [ ] 🚨 I checked that we cannot stop using a fork of the library
- [ ] 🚨 I created pull requests to push the fixes done in our fork to the main repository
- [ ] 🚨 I checked that we cannot upgrade to a more recent
- [ ] 🚨 I checked that we've documented why we're still using a fork of this library in [confluence](https://confluence.jahia.com/display/PR/Releasing+our+project+forks)
### Security
- [ ] 🔝 I checked that there are no known security vulnerabilities affecting this codebase
### CI/CD
- [ ] 🚨 The build and the release/publish workflows are configured (or at least documented in [confluence](https://confluence.jahia.com/display/PR/Releasing+our+project+forks))
### GitHub
- [ ] 🟠 [Branch protection](https://confluence.jahia.com/display/PR/GitHub+%28Product%29+-+Ref+ISPOL08.A14025#GitHub(Product)RefISPOL08.A14025-Branchprotection) is enabled for the repository
- [ ] **Automatically delete head branches** is selected in **Settings**
- [ ] 🙏 Repository topics match are populated (at a minimum: "product" and "supported")
