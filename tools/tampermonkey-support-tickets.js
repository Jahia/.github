// ==UserScript==
// @name         GitHub Issue Jira Links
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Add clickable Jira ticket links from the "Jira tickets" project field. Works in both issue pages and project board pane views.
// @author       Fgerthoffert
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/projects/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const cfgJiraBaseURL = 'https://support.jahia.com/browse/';
    const cfgTicketsFieldName = 'Jira tickets';
    const cfgIssueEventsBaseURL = 'https://zencrepes.jahia.com/zindex/';
    const JIRA_SECTION_ID = 'tampermonkey-jira-links';

    // --- View detection ---

    function isProjectPaneView() {
        const url = window.location.href;
        return url.includes('/projects/') && url.includes('pane=issue');
    }

    // --- DOM helpers ---

    function removeExistingJiraSection() {
        const existing = document.getElementById(JIRA_SECTION_ID);
        if (existing) existing.remove();
    }

    // --- Issue view: find projects in sidebar ---

    function findAllProjectsInSidebar() {
        const projectsSidebar = document.querySelector('[data-testid="sidebar-projects-section"]');
        if (!projectsSidebar) {
            console.log("[Jira Links] No projects sidebar found");
            return [];
        }
        // Try the standard issue view container first
        let container = projectsSidebar.querySelector('div:nth-child(2) > div');
        if (!container) {
            // Fallback: look for any child div that contains project entries
            container = projectsSidebar.querySelector('div > div');
        }
        if (!container) {
            console.log("[Jira Links] No project entries container found");
            return [];
        }
        const projectEntries = Array.from(container.children);
        console.log("[Jira Links] Found " + projectEntries.length + " project(s) in sidebar");
        return projectEntries;
    }

    function expandProject(project) {
        if (!project) return;
        if (!project.textContent.includes(cfgTicketsFieldName)) {
            const expandButton = project.querySelector('[data-component="IconButton"]');
            if (expandButton) {
                console.log("[Jira Links] Expanding project");
                expandButton.click();
            }
        }
    }

    function getTicketsFieldFromProject(project) {
        const ul = project.querySelector('div > ul');
        if (!ul) return undefined;
        const fields = Array.from(ul.children);
        for (const field of fields) {
            if (field.textContent.includes(cfgTicketsFieldName)) {
                // Primary selector: li > span > button > span (issue view structure)
                const spans = field.querySelectorAll('li > span > button > span');
                if (spans && spans.length > 1) {
                    return spans[1].textContent;
                }
                // Fallback: look for any span containing a ticket-like pattern
                const allSpans = field.querySelectorAll('span');
                for (const span of allSpans) {
                    const text = span.textContent.trim();
                    if (text && text !== cfgTicketsFieldName && /[A-Z]+-\d+/.test(text)) {
                        return text;
                    }
                }
            }
        }
        return undefined;
    }



    // --- Ticket parsing ---

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

    // --- Rendering ---

    function createJiraSection(ticketIDs, jiraBaseURL, targetContainer) {
        console.log("[Jira Links] Creating links for tickets: ", ticketIDs);
        removeExistingJiraSection();

        const jiraSection = document.createElement('div');
        jiraSection.id = JIRA_SECTION_ID;
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

        if (targetContainer) {
            targetContainer.appendChild(jiraSection);
        }
    }

    function findTargetContainer() {
        // Issue view: metadata section
        const issueMetadata = document.querySelector('[data-testid="issue-metadata-fixed"] > div');
        if (issueMetadata) return issueMetadata;

        // Project pane view: look for the sidebar projects section itself and insert after it
        const projectsSidebar = document.querySelector('[data-testid="sidebar-projects-section"]');
        if (projectsSidebar) return projectsSidebar.parentElement;

        // Fallback: issue body
        const issueBody = document.querySelector('[data-testid="issue-body"]');
        if (issueBody) return issueBody.parentElement;

        return null;
    }

    // --- Issue object extraction ---

    function getIssueObject(url) {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');

        let organization, repository, number;

        if (url.includes('/issues/')) {
            organization = pathSegments[1];
            repository = pathSegments[2];
            number = pathSegments[4];
        } else if (url.includes('/projects/')) {
            const issueParam = urlObj.searchParams.get('issue');
            if (issueParam) {
                const issueParts = issueParam.split('|');
                organization = issueParts[0];
                repository = issueParts[1];
                number = issueParts[2];
            }
        }

        return { organization, repository, number };
    }

    // --- Issue event link ---

    function addLinkToIssueEvent(issue, baseURL) {
        console.log("[Jira Links] Adding a link to issue events");
        const phActionsDiv = document.querySelector('div[data-component="PH_Actions"]');
        if (phActionsDiv !== null) {
            const innerDiv = phActionsDiv.querySelector('div');
            if (innerDiv) {
                // Avoid adding duplicate links
                if (innerDiv.querySelector('a[title*="issue events"]')) return;
                const link = document.createElement('a');
                link.textContent = '🕰️';
                link.href = baseURL + "/" + issue.organization + "/" + issue.repository + "/txt/" + issue.number + ".txt";
                link.target = '_blank';
                link.title = "Display issue events (⚠️ VPN REQUIRED ⚠️)";
                innerDiv.appendChild(link);
            }
        } else {
            console.log("[Jira Links] Unable to find the issue actions to add the icon to");
        }
    }

    // --- Main logic ---

    function collectTicketsFromSidebar() {
        const projects = findAllProjectsInSidebar();
        for (const project of projects) {
            expandProject(project);
        }

        setTimeout(() => {
            const allTicketIds = [];
            for (const project of projects) {
                const content = getTicketsFieldFromProject(project);
                const ids = getTicketIds(content);
                if (ids.length > 0) allTicketIds.push(...ids);
            }
            const uniqueTicketIds = [...new Set(allTicketIds)];
            if (uniqueTicketIds.length > 0) {
                const container = findTargetContainer();
                createJiraSection(uniqueTicketIds, cfgJiraBaseURL, container);
            }
        }, 1000);
    }

    function init() {
        console.log("[Jira Links] Initializing for URL:", window.location.href);
        removeExistingJiraSection();

        const issue = getIssueObject(window.location.href);
        console.log("[Jira Links] Issue:", issue);

        // Add issue event history link (for Jahia org only)
        if (issue.organization === "Jahia" && issue.number) {
            addLinkToIssueEvent(issue, cfgIssueEventsBaseURL);
        }

        // Use the same sidebar-based approach for both issue view and project pane view
        collectTicketsFromSidebar();
    }

    // --- SPA navigation handling ---
    // Project views use pushState/replaceState for navigation without full page reloads.

    let lastUrl = window.location.href;

    function onUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("[Jira Links] URL changed, re-initializing");
            // Wait for the new pane content to render
            setTimeout(init, 1500);
        }
    }

    // Intercept pushState and replaceState to detect SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        onUrlChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        onUrlChange();
    };

    window.addEventListener('popstate', onUrlChange);

    // Run on initial page load
    window.addEventListener('load', () => {
        setTimeout(init, 2000);
    });

    // Also observe DOM changes for dynamic pane loading (e.g., clicking an issue in project view)
    const observer = new MutationObserver(() => {
        onUrlChange();
    });
    observer.observe(document.querySelector('head > title') || document.head, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
