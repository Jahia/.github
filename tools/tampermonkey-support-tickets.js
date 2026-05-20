// ==UserScript==
// @name         GitHub Issue Jira Links
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Add a section below the GitHub issue description with Jira tickets listed from the "Jira tickets" field across all projects.
// @author       Fgerthoffert
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/projects/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const cfgJiraBaseURL = 'https://support.jahia.com/browse/'; // Update with your Jira instance URL.
    const cfgTicketsFieldName = 'Jira tickets'
    const cfgIssueEventsBaseURL = 'https://zencrepes.jahia.com/zindex/'; // Update with the host containing the issue events

    function findAllProjects() {
        const projectsSidebar = document.querySelector('[data-testid="sidebar-projects-section"]');
        if (!projectsSidebar) {
            console.log("No projects sidebar found");
            return [];
        }
        const container = projectsSidebar.querySelector('div:nth-child(2) > div');
        if (!container) {
            console.log("No project entries container found");
            return [];
        }
        const projectEntries = Array.from(container.children);
        console.log("Found " + projectEntries.length + " project(s) in sidebar");
        return projectEntries;
    }

    function expandProject(project) {
        if (project !== undefined) {
            // Not clicking if the field is already visible
            if (!project.textContent.includes(cfgTicketsFieldName)) {
                const expandButton = project.querySelector('[data-component="IconButton"]');
                if (expandButton) {
                    console.log("Clicking on expand button for project");
                    expandButton.click();
                }
            }
        }
    }

    function getTicketsFieldContent(project, ticketsFieldName) {
        let ticketsField;
        let fieldContent;
        const ul = project.querySelector('div > ul');
        if (!ul) return undefined;
        const projectFieldsEntries = Array.from(ul.children);
        for (const projectField of projectFieldsEntries) {
            if (projectField.textContent.includes(ticketsFieldName)) {
                console.log("Field: " + ticketsFieldName + " found in project")
                ticketsField = projectField
            }
        }

        if (ticketsField !== undefined) {
            const spans = ticketsField.querySelectorAll('li > span > button > span');
            if (spans && spans.length > 1) {
                fieldContent = spans[1].textContent;
            }
        }
        return fieldContent;
    }

    function getTicketIds(ticketsFieldContent) {
        if (!ticketsFieldContent || ticketsFieldContent.includes("Enter text")) {
            return [];
        }
        return ticketsFieldContent
            .trim()
            .split(',')
            .map(ticket => ticket.trim())
            .filter(ticket => ticket.length > 0 && /^[A-Z]+-\d+$/.test(ticket));
    }

    function createJiraSection(ticketIDs, jiraBaseURL) {
        console.log("Creating links for tickets: ", ticketIDs)
        const jiraSection = document.createElement('div');
        jiraSection.style.marginTop = '20px';

        jiraSection.innerHTML = `
          <div style="display: flex; align-items: center; gap: 2px; font-size: 14px;">
              <span style="font-size: 12px; font-weight: bold;">Jira Tickets:</span>
              <div style="display: flex; flex-wrap: nowrap; gap: 10px; overflow-x: auto;">
                  ${ticketIDs
                    .map(ticketID => `<span style="background-color: #f1f8ff; padding: 5px 10px; border-radius: 5px; white-space: nowrap; font-size: 12px;"><a href="${jiraBaseURL}${ticketID}" target="_blank" style="text-decoration: none; color: #0366d6;">${ticketID}</a></span>`)
                    .join('')}
              </div>
          </div>
      `;

        // Find the description container and append the new section below it.
        const descriptionContainer = document.querySelector('[data-testid="issue-metadata-fixed"] > div');
        if (descriptionContainer) {
            descriptionContainer.appendChild(jiraSection);
        }
    }

    function getIssueObject(url) {
        // Should support these two URL formats:
        // https://github.com/Jahia/jahia-private/issues/2893
        // https://github.com/orgs/Jahia/projects/50/views/1?pane=issue&itemId=99829665&issue=Jahia%7Cjahia-private%7C2893
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');

        let organization, repository, number;

        if (url.includes('issues')) {
            // Handling issue URL
            organization = pathSegments[1];
            repository = pathSegments[2];
            number = pathSegments[4];
        } else if (url.includes('projects')) {
            // Handling project URL
            const issueParam = urlObj.searchParams.get('issue');
            if (issueParam) {
                const issueParts = issueParam.split('|');
                organization = issueParts[0];
                repository = issueParts[1];
                number = issueParts[2];
            }
        }

        return {
            organization,
            repository,
            number
        };
    }

    function addLinkToIssueEvent(issue, baseURL) {
        console.log("Adding a link to issue events")
        const phActionsDiv = document.querySelector('div[data-component="PH_Actions"]');
        if (phActionsDiv !== null) {
            console.log(phActionsDiv)
            const innerDiv = phActionsDiv.querySelector('div');
            if (innerDiv) {
                const link = document.createElement('a');
                link.textContent = '🕰️';
                link.href = baseURL + "/" + issue.organization + "/" + issue.repository + "/txt/" + issue.number + ".txt";
                link.target = '_blank'; // Open the link in a new window
                link.title = "Display issue events (⚠️ VPN REQUIRED ⚠️)";

                // Append the link as the last element of the inner div
                innerDiv.appendChild(link);
            }
        } else {
            console.log("Unable to find the issue actions to add the icon to")
        }
    }

    function init() {
        // Add a link to the issue event history
        const issue = getIssueObject(window.location.href)
        console.log("Extracted the following about the issue:", issue);
        if (issue.organization !== "Jahia") {
            console.log("Organization is not Jahia, not displaying the history icon")
        } else {
            console.log("Displaying link to issue history disabled until: INFRA-3252")
            addLinkToIssueEvent(issue, cfgIssueEventsBaseURL);
        }

        // Find and expand all projects, then extract tickets from all of them.
        const projects = findAllProjects();
        for (const project of projects) {
            expandProject(project);
        }

        setTimeout(() => {
            const allTicketIds = [];
            for (const project of projects) {
                const ticketsFieldContent = getTicketsFieldContent(project, cfgTicketsFieldName);
                const ticketIds = getTicketIds(ticketsFieldContent);
                if (ticketIds.length > 0) {
                    allTicketIds.push(...ticketIds);
                }
            }
            // Deduplicate tickets (same ticket may appear in multiple projects)
            const uniqueTicketIds = [...new Set(allTicketIds)];
            if (uniqueTicketIds.length > 0) {
                createJiraSection(uniqueTicketIds, cfgJiraBaseURL);
            }
        }, 1000); // Delay to ensure the expanded content is loaded.
    }

    // Run the script after the page loads completely.
    window.addEventListener('load', () => {
        setTimeout(init, 2000); // Allow time for dynamic GitHub content to load.
    });
})();
